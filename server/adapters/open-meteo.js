// Open-Meteo adapter — keyless. Merges two endpoints (forecast + air-quality)
// into the neutral schema. See server/adapters/README.md for the contract.
//
// Gaps handled here:
//   - no weather alerts        → alerts: []
//   - WMO codes ≠ neutral ids  → convert.wmoToConditionId / wmoToText
//   - wind bearing in degrees  → convert.degToCompass
//   - sunrise/sunset ISO       → convert.isoToAmPm
//   - us_aqi (0–500)           → convert.usAqiToEpaIndex (1–6)
//   - no vendor icons          → condition.icon_url: ""
//   - no reverse geocoding     → BigDataCloud (keyless) for "lat,lon" names
const { getJson } = require('./_shared/http');
const {
  cToF, degToCompass, isoToAmPm, isoToSpace, localEpoch,
  usAqiToEpaIndex, wmoToConditionId, wmoToText,
} = require('./_shared/convert');

const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const REVERSE = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

const LATLON = /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/;

// Open-Meteo gives a longer forecast than WeatherAPI — expose a week. The
// client renders whatever length `daily[]` has (header is dynamic).
const FORECAST_DAYS = 7;

// Resolve a query (name or "lat,lon") to { name, region, country, lat, lon }.
async function resolveLocation(city) {
  if (LATLON.test(city)) {
    const [lat, lon] = city.split(',').map((n) => Number(n.trim()));
    let place = { name: '', region: '', country: '' };
    try {
      const geo = await getJson(`${REVERSE}?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      place = {
        name: geo.city || geo.locality || geo.principalSubdivision || 'Selected location',
        region: geo.principalSubdivision || '',
        country: geo.countryName || '',
      };
    } catch {
      place.name = 'Selected location'; // reverse geocode is best-effort
    }
    return { ...place, lat, lon };
  }

  const geo = await getJson(`${GEO}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  const r = geo.results?.[0];
  if (!r) {
    const err = new Error('City not found');
    err.status = 404;
    throw err;
  }
  return { name: r.name, region: r.admin1 || '', country: r.country || '', lat: r.latitude, lon: r.longitude };
}

async function fetchWeather(city) {
  const loc = await resolveLocation(city);

  const forecastUrl =
    `${FORECAST}?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,` +
    `wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,surface_pressure,visibility,uv_index,cloud_cover` +
    `&hourly=temperature_2m,weather_code,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,` +
    `snowfall_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset` +
    `&timezone=auto&forecast_days=${FORECAST_DAYS}`;
  const airUrl =
    `${AIR}?latitude=${loc.lat}&longitude=${loc.lon}` +
    `&current=pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,us_aqi`;

  // Air quality is non-critical — never let it fail the whole request.
  const [fc, air] = await Promise.all([
    getJson(forecastUrl),
    getJson(airUrl).catch(() => null),
  ]);

  const offset = fc.utc_offset_seconds || 0;
  const cur = fc.current;
  const hourly = fc.hourly;
  const daily = fc.daily;

  // Build daily rows, nesting each day's hours (filtered by date prefix).
  const dailyOut = (daily?.time || []).map((date, i) => {
    const hour = [];
    for (let j = 0; j < hourly.time.length; j++) {
      const t = hourly.time[j];
      if (!t.startsWith(date)) continue;
      const code = hourly.weather_code[j];
      const deg = hourly.wind_direction_10m[j];
      hour.push({
        time: isoToSpace(t),
        time_epoch: localEpoch(t, offset),
        temp: { c: hourly.temperature_2m[j], f: cToF(hourly.temperature_2m[j]) },
        condition: { id: wmoToConditionId(code), text: wmoToText(code) },
        is_day: hourly.is_day[j],
        wind: {
          speed_kph: hourly.wind_speed_10m[j],
          dir: degToCompass(deg),
          degree: deg,
          gust_kph: hourly.wind_gusts_10m[j],
        },
      });
    }

    const dcode = daily.weather_code[i];
    const snow = daily.snowfall_sum[i] ?? 0;
    return {
      date,
      high: { c: daily.temperature_2m_max[i], f: cToF(daily.temperature_2m_max[i]) },
      low: { c: daily.temperature_2m_min[i], f: cToF(daily.temperature_2m_min[i]) },
      condition: { id: wmoToConditionId(dcode), text: wmoToText(dcode), icon_url: '' },
      chance_of_rain: daily.precipitation_probability_max[i] ?? 0,
      chance_of_snow: 0, // Open-Meteo has no snow-probability; snow chip uses total_snow_cm
      max_wind_kph: daily.wind_speed_10m_max[i],
      uv: daily.uv_index_max[i],
      total_snow_cm: snow,
      astro: { sunrise: isoToAmPm(daily.sunrise[i]), sunset: isoToAmPm(daily.sunset[i]) },
      hour,
    };
  });

  const aq = air?.current;

  return {
    location: {
      name: loc.name,
      region: loc.region,
      country: loc.country,
      lat: fc.latitude,
      lon: fc.longitude,
      localtime: isoToSpace(cur.time),
      timezone: fc.timezone,
    },
    current: {
      temp: { c: cur.temperature_2m, f: cToF(cur.temperature_2m) },
      feels_like: { c: cur.apparent_temperature, f: cToF(cur.apparent_temperature) },
      condition: {
        id: wmoToConditionId(cur.weather_code),
        text: wmoToText(cur.weather_code),
        icon_url: '',
      },
      is_day: cur.is_day,
      wind: {
        speed_kph: cur.wind_speed_10m,
        dir: degToCompass(cur.wind_direction_10m),
        degree: cur.wind_direction_10m,
        gust_kph: cur.wind_gusts_10m,
      },
      humidity: cur.relative_humidity_2m,
      uv: cur.uv_index,
      precip_mm: cur.precipitation,
      visibility_km: cur.visibility != null ? Math.round(cur.visibility / 100) / 10 : null,
      pressure_mb: cur.surface_pressure,
      cloud_cover: cur.cloud_cover, // %
      moon_phase: null, // Open-Meteo has no moon data
      moon_illumination: null,
      air_quality: aq
        ? {
            pm2_5: aq.pm2_5,
            pm10: aq.pm10,
            o3: aq.ozone,
            no2: aq.nitrogen_dioxide,
            so2: aq.sulphur_dioxide,
            co: aq.carbon_monoxide,
            epa_index: usAqiToEpaIndex(aq.us_aqi),
          }
        : null,
    },
    daily: dailyOut,
    alerts: [],
  };
}

// Self-describing capability descriptor — drives availability + the future
// client provider selector. Keyless, so always available.
const meta = {
  id: 'open-meteo',
  label: 'Open-Meteo',
  keyRequired: false,
  keyEnvVar: null,
  forecastDays: FORECAST_DAYS,
  supportsAlerts: false,      // Open-Meteo has no severe-weather alerts
  supportsAirQuality: true,   // via the separate air-quality endpoint
  supportsCloudCover: true,
  supportsMoonPhase: false,   // no moon data
};

module.exports = { fetchWeather, meta };
