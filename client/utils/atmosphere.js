// Atmosphere helpers — turn the neutral weather schema into the visual signals
// the particle layer needs: day/night lighting, precip intensity, and wind lean.
// Weather *class* comes from utils/weatherMood.js. (The background is a simple
// fixed accent glow per theme — no data-driven sky here.)

// Parse a "6:12 AM" clock string into minutes-since-midnight. Shared with
// components/SunriseSunset.jsx so there is a single solar-time parser.
export function parseTime(str) {
  if (!str || !str.includes(':')) return NaN;
  const [time, period] = str.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

// Time-of-day is a lighting modifier layered OVER the weather, never a mood.
export function getPeriod(isDay) {
  return isDay ? 'day' : 'night';
}

// ---------------------------------------------------------------------------
// Precip intensity — drizzle vs downpour. Returns null for non-precip moods.
// ---------------------------------------------------------------------------
export function getPrecipIntensity(mood, { precip_mm, chance_of_rain } = {}) {
  if (mood !== 'rainy' && mood !== 'snowy' && mood !== 'stormy') return null;

  const mm = Number(precip_mm) || 0;
  const chance = Number(chance_of_rain) || 0;

  let tier;
  if (mood === 'snowy') {
    // Snow water-equivalent is much lower than rain for the same visual density.
    if (mm > 0) tier = mm >= 2.5 ? 'heavy' : mm >= 0.8 ? 'moderate' : 'light';
    else tier = chance >= 70 ? 'heavy' : chance >= 40 ? 'moderate' : 'light';
  } else {
    if (mm > 0) tier = mm >= 7.6 ? 'heavy' : mm >= 2.5 ? 'moderate' : 'light';
    else tier = chance >= 70 ? 'heavy' : chance >= 40 ? 'moderate' : 'light';
  }

  // Thunderstorms read as at least moderate regardless of measured accumulation.
  if (mood === 'stormy' && tier === 'light') tier = 'moderate';
  return tier;
}
