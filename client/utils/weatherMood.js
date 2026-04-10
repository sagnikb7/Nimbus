const RAIN_CODES = new Set([
  1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189,
  1192, 1195, 1198, 1201, 1240, 1243, 1246,
]);

const SNOW_CODES = new Set([
  1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213,
  1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258,
  1261, 1264,
]);

const STORM_CODES = new Set([1087, 1273, 1276, 1279, 1282]);

export function getWeatherMood(code, isDay) {
  if (!isDay) return 'night';
  if (code === 1000) return 'clear';
  if (code === 1003) return 'clear';
  if (code === 1006 || code === 1009) return 'cloudy';
  if (code === 1030 || code === 1135 || code === 1147) return 'cloudy';
  if (STORM_CODES.has(code)) return 'stormy';
  if (RAIN_CODES.has(code)) return 'rainy';
  if (SNOW_CODES.has(code)) return 'snowy';
  return 'clear';
}
