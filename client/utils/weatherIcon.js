// Maps WeatherAPI condition codes (+ is_day) to bundled Meteocons SVGs in /public/wx.
// Replaces the WeatherAPI raster PNGs with crisp, theme-independent vector icons.
// Icon set: Meteocons by Bas Milius (MIT) — @bybas/weather-icons.

// Codes whose icon differs by day vs night: [dayName, nightName]
const DAY_NIGHT = {
  1000: ['clear-day', 'clear-night'],            // Sunny / Clear
  1003: ['partly-cloudy-day', 'partly-cloudy-night'], // Partly cloudy
  1009: ['overcast-day', 'overcast-night'],      // Overcast
  1135: ['fog-day', 'fog-night'],                // Fog
  1147: ['fog-day', 'fog-night'],                // Freezing fog
  1063: ['partly-cloudy-day-rain', 'partly-cloudy-night-rain'],   // Patchy rain
  1150: ['partly-cloudy-day-rain', 'partly-cloudy-night-rain'],   // Patchy light drizzle
  1180: ['partly-cloudy-day-rain', 'partly-cloudy-night-rain'],   // Patchy light rain
  1240: ['partly-cloudy-day-rain', 'partly-cloudy-night-rain'],   // Light rain shower
  1066: ['partly-cloudy-day-snow', 'partly-cloudy-night-snow'],   // Patchy snow
  1210: ['partly-cloudy-day-snow', 'partly-cloudy-night-snow'],   // Patchy light snow
  1255: ['partly-cloudy-day-snow', 'partly-cloudy-night-snow'],   // Light snow showers
  1273: ['thunderstorms-day', 'thunderstorms-night'],            // Patchy light rain w/ thunder
  1279: ['thunderstorms-day', 'thunderstorms-night'],            // Patchy light snow w/ thunder
};

// Codes with a single icon regardless of day/night
const FIXED = {
  1006: 'cloudy',
  1030: 'mist',
  // drizzle / freezing drizzle
  1072: 'drizzle', 1153: 'drizzle', 1168: 'drizzle', 1171: 'drizzle',
  // rain (incl. heavy — no extreme-rain icon, falls back to rain)
  1183: 'rain', 1186: 'rain', 1189: 'rain', 1192: 'rain', 1195: 'rain',
  1243: 'rain', 1246: 'rain',
  // sleet / freezing rain
  1069: 'sleet', 1198: 'sleet', 1201: 'sleet', 1204: 'sleet', 1207: 'sleet',
  1249: 'sleet', 1252: 'sleet',
  // snow
  1114: 'snow', 1117: 'snow', 1213: 'snow', 1216: 'snow', 1219: 'snow',
  1222: 'snow', 1225: 'snow', 1258: 'snow',
  // ice pellets / hail
  1237: 'hail', 1261: 'hail', 1264: 'hail',
  // thunderstorms with precipitation
  1087: 'thunderstorms-rain', 1276: 'thunderstorms-rain', 1282: 'thunderstorms-rain',
};

export function getWeatherIcon(code, isDay = 1) {
  const dn = DAY_NIGHT[code];
  if (dn) return `/wx/${isDay ? dn[0] : dn[1]}.svg`;
  const fixed = FIXED[code];
  if (fixed) return `/wx/${fixed}.svg`;
  return `/wx/${isDay ? 'cloudy' : 'overcast-night'}.svg`; // sensible fallback
}

// Sun/astro glyphs for the sunrise/sunset timeline
export const SUN_ICONS = {
  sunrise: '/wx/sunrise.svg',
  sunset: '/wx/sunset.svg',
  moonrise: '/wx/moonrise.svg',
};
