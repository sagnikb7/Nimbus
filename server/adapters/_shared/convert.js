// Pure conversion helpers used by adapters to normalize vendor quirks into the
// neutral schema. No I/O, no dependencies — trivially unit-testable.

const cToF = (c) => (c == null ? null : (c * 9) / 5 + 32);

// Wind bearing in degrees → 16-point compass string ("NW", "SSE", …).
// Matches WeatherAPI's wind_dir vocabulary so windUtils' prevailing-direction
// tally behaves identically across providers.
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
function degToCompass(deg) {
  if (deg == null) return '';
  return COMPASS[Math.round((deg % 360) / 22.5) % 16];
}

// Local ISO wall-clock ("2026-07-01T06:12") → "6:12 AM".
// Parsed by hand (not `new Date`) so the server's own timezone never shifts it —
// the string is already in the city's local time (Open-Meteo timezone=auto).
function isoToAmPm(iso) {
  if (!iso || !iso.includes('T')) return '';
  const [, time] = iso.split('T');
  let [h, m] = time.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m ?? 0).padStart(2, '0')} ${ap}`;
}

// Local ISO wall-clock ("2026-07-01T17:45") → "2026-07-01 17:45", matching the
// space-separated format WeatherAPI uses for location.localtime and hour.time.
const isoToSpace = (iso) => (iso ? iso.replace('T', ' ').slice(0, 16) : iso);

// Unique epoch seconds for a local wall-clock string given the location's UTC
// offset. Only needs to be stable+unique per hour (used as a React key).
function localEpoch(iso, utcOffsetSeconds = 0) {
  const ms = Date.parse(`${iso}:00Z`);
  if (Number.isNaN(ms)) return 0;
  return Math.floor(ms / 1000) - utcOffsetSeconds;
}

// US AQI (0–500) → EPA category index (1–6), the fallback field aqiUtils reads.
function usAqiToEpaIndex(aqi) {
  if (aqi == null) return null;
  if (aqi <= 50) return 1;
  if (aqi <= 100) return 2;
  if (aqi <= 150) return 3;
  if (aqi <= 200) return 4;
  if (aqi <= 300) return 5;
  return 6;
}

// ---- WMO weather interpretation code → neutral condition id + text ----
// The neutral condition.id space is seeded from WeatherAPI's numeric codes so
// the existing Meteocons icon table (weatherIcon.js) and mood table
// (weatherMood.js) work unchanged. Open-Meteo speaks WMO codes, so we translate.
const WMO = {
  0:  [1000, 'Clear'],
  1:  [1003, 'Mainly clear'],
  2:  [1003, 'Partly cloudy'],
  3:  [1006, 'Overcast'],
  45: [1135, 'Fog'],
  48: [1147, 'Freezing fog'],
  51: [1150, 'Light drizzle'],
  53: [1153, 'Drizzle'],
  55: [1153, 'Dense drizzle'],
  56: [1168, 'Freezing drizzle'],
  57: [1171, 'Dense freezing drizzle'],
  61: [1183, 'Light rain'],
  63: [1189, 'Rain'],
  65: [1195, 'Heavy rain'],
  66: [1198, 'Freezing rain'],
  67: [1201, 'Heavy freezing rain'],
  71: [1210, 'Light snow'],
  73: [1213, 'Snow'],
  75: [1219, 'Heavy snow'],
  77: [1237, 'Snow grains'],
  80: [1240, 'Light rain showers'],
  81: [1243, 'Rain showers'],
  82: [1246, 'Violent rain showers'],
  85: [1255, 'Light snow showers'],
  86: [1258, 'Heavy snow showers'],
  95: [1087, 'Thunderstorm'],
  96: [1273, 'Thunderstorm with hail'],
  99: [1276, 'Thunderstorm with heavy hail'],
};
function wmoToConditionId(code) {
  return (WMO[code] || [1006])[0]; // default: overcast
}
function wmoToText(code) {
  return (WMO[code] || [null, 'Unknown'])[1];
}

module.exports = {
  cToF,
  degToCompass,
  isoToAmPm,
  isoToSpace,
  localEpoch,
  usAqiToEpaIndex,
  wmoToConditionId,
  wmoToText,
};
