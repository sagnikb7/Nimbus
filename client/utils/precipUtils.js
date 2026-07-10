// Precipitation helpers — read the precip data like a meteorologist and phrase
// it for a novice. Amounts are mm (liquid-equivalent); snow is cm.
import { RAIN_CODES, SNOW_CODES, STORM_CODES } from './weatherMood';
import { formatHour } from './chart';

// Standard meteorological rain-rate bands (mm per hour), with plain-language
// descriptions so a first-timer understands what the number feels like.
export const PRECIP_INTENSITY_LEVELS = [
  { key: 'none',     label: 'None',     min: 0,    max: 0.1,      description: 'No measurable precipitation.' },
  { key: 'light',    label: 'Light',    min: 0.1,  max: 2.5,      description: 'A drizzle or light shower — barely need an umbrella.' },
  { key: 'moderate', label: 'Moderate', min: 2.5,  max: 7.6,      description: 'Steady rain — an umbrella definitely helps.' },
  { key: 'heavy',    label: 'Heavy',    min: 7.6,  max: 50,       description: 'A downpour — you get soaked fast, roads pool up.' },
  { key: 'violent',  label: 'Violent',  min: 50,   max: Infinity, description: 'Torrential — poor visibility, flooding possible.' },
];

export function getPrecipIntensity(mm) {
  const v = Number(mm) || 0;
  return PRECIP_INTENSITY_LEVELS.find((l) => v >= l.min && v < l.max)
    || PRECIP_INTENSITY_LEVELS[PRECIP_INTENSITY_LEVELS.length - 1];
}

// Precip type from the neutral condition id (WeatherAPI code space).
export function getPrecipType(conditionId) {
  if (STORM_CODES.has(conditionId)) return 'thunderstorm';
  if (SNOW_CODES.has(conditionId)) return 'snow';
  if (RAIN_CODES.has(conditionId)) return 'rain';
  return 'none';
}

// Human word for a type (for hero/labels). Falls through to "Precipitation".
export function precipTypeLabel(type) {
  return { rain: 'Rain', snow: 'Snow', thunderstorm: 'Thunderstorm' }[type] || 'Precipitation';
}

// Next ~24h of precip, windowed like getHourlyWind / HourlyForecast.
export function getHourlyPrecip(forecastDays, localtime) {
  if (!forecastDays?.length) return [];
  const now = new Date(localtime);
  const out = [];
  for (const day of forecastDays) {
    for (const h of day.hour || []) {
      const diffH = (new Date(h.time) - now) / 3.6e6;
      if (diffH >= -0.5 && diffH <= 24) {
        out.push({
          time: h.time,
          time_epoch: h.time_epoch,
          precip_mm: Number(h.precip_mm) || 0,
          chance: Number(h.chance_of_rain) || 0,
          snow_cm: Number(h.snow_cm) || 0,
          conditionId: h.condition?.id,
          is_day: h.is_day,
        });
      }
    }
  }
  return out.slice(0, 24);
}

// An hour "reads as wet" if there's measurable fall or a real chance of it.
const isWet = (h) => h.precip_mm >= 0.1 || h.chance >= 50;

// When does precip next start (if dry) or stop (if wet)? Drives "Rain by 3 PM".
// Internal — consumed by getPrecipSummary.
function getNextPrecipChange(hours) {
  if (!hours?.length) return { kind: 'none', label: '' };
  const startingWet = isWet(hours[0]);
  for (let i = 1; i < hours.length; i++) {
    if (isWet(hours[i]) !== startingWet) {
      return {
        kind: startingWet ? 'stops' : 'starts',
        hour: hours[i],
        label: formatHour(hours[i].time),
      };
    }
  }
  return { kind: 'none', label: '' };
}

// Today's expected totals (sum the day's hours).
export function getTodayPrecipTotal(forecastDays) {
  const hours = forecastDays?.[0]?.hour || [];
  let mm = 0, snow_cm = 0;
  for (const h of hours) {
    mm += Number(h.precip_mm) || 0;
    snow_cm += Number(h.snow_cm) || 0;
  }
  return { mm, snow_cm };
}

export function getPeakPrecipHour(hours) {
  if (!hours?.length) return null;
  return hours.reduce((peak, h) => (h.precip_mm > (peak?.precip_mm ?? -1) ? h : peak), null);
}

const fmtMm = (mm) => (mm >= 10 ? Math.round(mm) : Math.round(mm * 10) / 10);

// Plain-language takeaway — 1–2 sentences a novice can act on.
export function getPrecipSummary(current, forecastDays, localtime) {
  const hours = getHourlyPrecip(forecastDays, localtime);
  const nowMm = Number(current.precip_mm) || 0;
  const type = getPrecipType(current.condition?.id);
  const raining = nowMm >= 0.1 || type !== 'none';
  const change = getNextPrecipChange(hours);
  const { mm, snow_cm } = getTodayPrecipTotal(forecastDays);

  const parts = [];
  if (raining) {
    const level = getPrecipIntensity(nowMm);
    const word = type === 'snow' ? 'snow' : type === 'thunderstorm' ? 'thundery rain' : 'rain';
    parts.push(`${level.label} ${word} right now.`);
    if (change.kind === 'stops') parts.push(`Easing off around ${change.label}.`);
    if (snow_cm >= 0.5) parts.push(`About ${fmtMm(snow_cm)} cm of snow expected today.`);
    else if (mm >= 0.5) parts.push(`Around ${fmtMm(mm)} mm expected today.`);
  } else {
    parts.push('Dry right now.');
    if (change.kind === 'starts') {
      const h = hours.find((x) => x.time === change.hour.time);
      const likely = h && h.chance >= 60 ? 'likely' : 'possible';
      parts.push(`Showers ${likely} around ${change.label}.`);
      if (mm >= 0.5) parts.push(`Up to ${fmtMm(mm)} mm expected today.`);
    } else {
      parts.push('Staying dry for the next 24 hours.');
    }
  }
  return parts.join(' ');
}

export { fmtMm };
