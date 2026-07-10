// WeatherAPI condition-code groups (other vendors translate into these ids).
// Exported so precip/type helpers can reuse them (see utils/precipUtils.js).
export const RAIN_CODES = new Set([
  1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189,
  1192, 1195, 1198, 1201, 1240, 1243, 1246,
]);

export const SNOW_CODES = new Set([
  1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213,
  1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258,
  1261, 1264,
]);

export const STORM_CODES = new Set([1087, 1273, 1276, 1279, 1282]);

// Classify the WEATHER only — never time-of-day. Night is a separate lighting
// modifier (see utils/atmosphere.js `getPeriod`), so a night storm still reads
// as 'stormy' and a clear night still reads as 'clear'. The `isDay` argument is
// accepted for backwards-compat but intentionally ignored.
export function getWeatherMood(code, _isDay) {
  if (code === 1000) return 'clear';
  if (code === 1003) return 'clear';
  if (code === 1006 || code === 1009) return 'cloudy';
  if (code === 1030 || code === 1135 || code === 1147) return 'cloudy';
  if (STORM_CODES.has(code)) return 'stormy';
  if (RAIN_CODES.has(code)) return 'rainy';
  if (SNOW_CODES.has(code)) return 'snowy';
  return 'clear';
}
