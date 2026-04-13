// Beaufort-scale wind categories (kph thresholds)
export const WIND_CATEGORIES = [
  { label: 'Calm',            className: 'wind-calm',         min: 0,   max: 1,   description: 'Smoke rises vertically' },
  { label: 'Light Air',       className: 'wind-light-air',    min: 2,   max: 5,   description: 'Smoke drifts slowly' },
  { label: 'Light Breeze',    className: 'wind-light',        min: 6,   max: 11,  description: 'Leaves rustle gently' },
  { label: 'Gentle Breeze',   className: 'wind-gentle',       min: 12,  max: 19,  description: 'Leaves and twigs move' },
  { label: 'Moderate Breeze', className: 'wind-moderate',     min: 20,  max: 28,  description: 'Small branches sway' },
  { label: 'Fresh Breeze',    className: 'wind-fresh',        min: 29,  max: 38,  description: 'Small trees begin to sway' },
  { label: 'Strong Breeze',   className: 'wind-strong',       min: 39,  max: 49,  description: 'Large branches in motion' },
  { label: 'Near Gale',       className: 'wind-near-gale',    min: 50,  max: 61,  description: 'Whole trees in motion' },
  { label: 'Gale',            className: 'wind-gale',         min: 62,  max: 74,  description: 'Twigs break off trees' },
  { label: 'Strong Gale',     className: 'wind-strong-gale',  min: 75,  max: 88,  description: 'Slight structural damage' },
  { label: 'Storm',           className: 'wind-storm',        min: 89,  max: 102, description: 'Trees uprooted' },
  { label: 'Violent Storm',   className: 'wind-violent',      min: 103, max: 117, description: 'Widespread damage' },
  { label: 'Cyclone-force',   className: 'wind-cyclone',      min: 118, max: Infinity, description: 'Devastating destruction' },
];

// Returns the Beaufort category for a given wind speed in kph
export function getWindCategory(kph) {
  const speed = kph || 0;
  return WIND_CATEGORIES.find((c) => speed <= c.max) || WIND_CATEGORIES[WIND_CATEGORIES.length - 1];
}

// Filters hourly forecast data to the next 24 hours relative to localtime.
// Returns simplified objects with wind-relevant fields.
// Same filtering logic as HourlyForecast.jsx.
export function getHourlyWind(forecastDays, localtime) {
  if (!forecastDays?.length) return [];
  const now = new Date(localtime);
  const hours = [];

  for (const day of forecastDays) {
    for (const hour of day.hour || []) {
      const hDate = new Date(hour.time);
      const diffH = (hDate - now) / (1000 * 60 * 60);
      if (diffH >= -0.5 && diffH <= 24) {
        hours.push(hour);
      }
    }
  }
  return hours.slice(0, 24);
}

// Returns the most frequent wind_dir from today's hourly data
export function getPrevailingDirection(forecastDays) {
  const today = forecastDays?.[0];
  if (!today?.hour?.length) return '--';

  const counts = {};
  for (const h of today.hour) {
    const dir = h.wind_dir;
    counts[dir] = (counts[dir] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// Compares average wind of past 6h vs next 6h to determine trend
export function getWindTrend(forecastDays, localtime) {
  if (!forecastDays?.length) return 'steady';
  const now = new Date(localtime);
  let pastSum = 0, pastCount = 0, futureSum = 0, futureCount = 0;

  for (const day of forecastDays) {
    for (const h of day.hour || []) {
      const diffH = (new Date(h.time) - now) / (1000 * 60 * 60);
      if (diffH >= -6 && diffH < 0) {
        pastSum += h.wind_kph;
        pastCount++;
      } else if (diffH >= 0 && diffH <= 6) {
        futureSum += h.wind_kph;
        futureCount++;
      }
    }
  }

  if (!pastCount || !futureCount) return 'steady';
  const delta = (futureSum / futureCount) - (pastSum / pastCount);
  if (delta > 5) return 'increasing';
  if (delta < -5) return 'decreasing';
  return 'steady';
}

// Assesses gust severity relative to sustained wind
export function getGustAssessment(windKph, gustKph) {
  const ratio = (gustKph || 0) / Math.max(windKph || 0, 1);
  if (ratio < 1.3) return { severity: 'minimal', description: 'Gusts are minimal' };
  if (ratio < 1.6) return { severity: 'moderate', description: 'Occasional moderate gusts' };
  if (ratio < 2.0) return { severity: 'strong', description: 'Strong gusty conditions' };
  return { severity: 'severe', description: 'Dangerously gusty' };
}

// Returns the hour with the highest wind_kph from today's forecast
export function getPeakWindHour(forecastDays) {
  const today = forecastDays?.[0];
  if (!today?.hour?.length) return null;

  let peak = today.hour[0];
  for (const h of today.hour) {
    if (h.wind_kph > peak.wind_kph) peak = h;
  }
  return peak;
}

// Formats an hour string like "3 PM" from a time string
function formatHour(timeStr) {
  const h = new Date(timeStr).getHours();
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

// Generates a 2-3 sentence plain-language wind summary
export function getWindSummary(current, forecastDays, localtime) {
  const cat = getWindCategory(current.wind_kph);
  const trend = getWindTrend(forecastDays, localtime);
  const gust = getGustAssessment(current.wind_kph, current.gust_kph);
  const peak = getPeakWindHour(forecastDays);

  const sentences = [];

  // Current conditions
  sentences.push(
    `Wind is currently ${cat.label.toLowerCase()} at ${Math.round(current.wind_kph)} km/h from the ${current.wind_dir}. ${cat.description}.`
  );

  // Gust note (only if notable)
  if (gust.severity !== 'minimal') {
    sentences.push(`${gust.description}, with gusts up to ${Math.round(current.gust_kph)} km/h.`);
  }

  // Trend
  const trendText = {
    increasing: 'Winds are expected to pick up over the next few hours.',
    decreasing: 'Winds are expected to ease over the next few hours.',
    steady: 'Winds are expected to remain steady.',
  };
  sentences.push(trendText[trend]);

  // Peak hour hint
  if (peak) {
    sentences.push(`Strongest winds today around ${formatHour(peak.time)}.`);
  }

  return sentences.join(' ');
}
