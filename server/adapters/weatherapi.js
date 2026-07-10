// WeatherAPI.com adapter — maps forecast.json into the neutral schema.
// See server/adapters/README.md for the contract.
const { getJson } = require('./_shared/http');

// WeatherAPI icons are protocol-relative ("//cdn...png").
const httpsIcon = (icon) => (icon && icon.startsWith('//') ? `https:${icon}` : icon || '');

function mapCondition(condition, { withIcon } = {}) {
  const out = { id: condition.code, text: condition.text };
  if (withIcon) out.icon_url = httpsIcon(condition.icon);
  return out;
}

function mapHour(h) {
  return {
    time: h.time,
    time_epoch: h.time_epoch,
    temp: { c: h.temp_c, f: h.temp_f },
    condition: mapCondition(h.condition),
    is_day: h.is_day,
    chance_of_rain: h.chance_of_rain ?? 0,
    precip_mm: h.precip_mm ?? 0,
    snow_cm: h.snow_cm ?? 0,
    wind: { speed_kph: h.wind_kph, dir: h.wind_dir, degree: h.wind_degree, gust_kph: h.gust_kph },
  };
}

function mapAlert(a) {
  return {
    event: a.event,
    headline: a.headline,
    severity: a.severity,
    areas: a.areas,
    effective: a.effective,
    expires: a.expires,
    description: a.desc,
    instruction: a.instruction,
  };
}

function mapDay(fd) {
  const d = fd.day;
  return {
    date: fd.date,
    high: { c: d.maxtemp_c, f: d.maxtemp_f },
    low: { c: d.mintemp_c, f: d.mintemp_f },
    condition: mapCondition(d.condition, { withIcon: true }),
    chance_of_rain: d.daily_chance_of_rain ?? 0,
    chance_of_snow: d.daily_chance_of_snow ?? 0,
    max_wind_kph: d.maxwind_kph,
    uv: d.uv,
    total_snow_cm: d.totalsnow_cm ?? 0,
    astro: { sunrise: fd.astro?.sunrise, sunset: fd.astro?.sunset },
    hour: (fd.hour || []).map(mapHour),
  };
}

async function fetchWeather(city, { apiKey } = {}) {
  if (!apiKey) {
    const err = new Error('Weather API key is not configured');
    err.status = 500;
    throw err;
  }
  const url =
    `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}` +
    `&q=${encodeURIComponent(city)}&days=${FORECAST_DAYS}&aqi=yes&alerts=yes`;
  const raw = await getJson(url);

  const c = raw.current;
  const aq = c.air_quality;
  const astro0 = raw.forecast?.forecastday?.[0]?.astro;

  return {
    location: {
      name: raw.location.name,
      region: raw.location.region,
      country: raw.location.country,
      lat: raw.location.lat,
      lon: raw.location.lon,
      localtime: raw.location.localtime,
      timezone: raw.location.tz_id,
    },
    current: {
      temp: { c: c.temp_c, f: c.temp_f },
      feels_like: { c: c.feelslike_c, f: c.feelslike_f },
      condition: mapCondition(c.condition, { withIcon: true }),
      is_day: c.is_day,
      wind: { speed_kph: c.wind_kph, dir: c.wind_dir, degree: c.wind_degree, gust_kph: c.gust_kph },
      humidity: c.humidity,
      dewpoint: c.dewpoint_c != null ? { c: c.dewpoint_c, f: c.dewpoint_f } : null,
      uv: c.uv,
      precip_mm: c.precip_mm,
      visibility_km: c.vis_km,
      pressure_mb: c.pressure_mb,
      cloud_cover: c.cloud, // %
      moon_phase: astro0?.moon_phase ?? null,
      moon_illumination: astro0 ? Number(astro0.moon_illumination) : null,
      air_quality: aq
        ? {
            pm2_5: aq.pm2_5,
            pm10: aq.pm10,
            o3: aq.o3,
            no2: aq.no2,
            so2: aq.so2,
            co: aq.co,
            epa_index: aq['us-epa-index'],
          }
        : null,
    },
    daily: (raw.forecast?.forecastday || []).map(mapDay),
    alerts: (raw.alerts?.alert || []).map(mapAlert),
  };
}

// Self-describing capability descriptor. Requires a key; the value is resolved
// at runtime from process.env[keyEnvVar] (never stored here). keyEnvVarFallback
// keeps older deploys working after the WEATHER_API_KEY → WEATHERAPI_KEY rename.
// WeatherAPI's free tier caps the forecast at 3 days.
const FORECAST_DAYS = 3;

const meta = {
  id: 'weatherapi',
  label: 'WeatherAPI.com',
  keyRequired: true,
  keyEnvVar: 'WEATHERAPI_KEY',
  keyEnvVarFallback: 'WEATHER_API_KEY',
  forecastDays: FORECAST_DAYS,
  supportsAlerts: true,       // forecast.json with alerts=yes
  supportsAirQuality: true,   // forecast.json with aqi=yes
  supportsCloudCover: true,
  supportsMoonPhase: true,    // astro.moon_phase
};

module.exports = { fetchWeather, meta };
