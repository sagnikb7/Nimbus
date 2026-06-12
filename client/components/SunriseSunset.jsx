import { SUN_ICONS } from '../utils/weatherIcon';

function parseTime(str) {
  if (!str || !str.includes(':')) return NaN;
  const [time, period] = str.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function fmtDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function SunriseSunset({ astro, nextAstro, localtime, isDay }) {
  const sunriseMin = parseTime(astro.sunrise);
  const sunsetMin = parseTime(astro.sunset);
  if (Number.isNaN(sunriseMin) || Number.isNaN(sunsetMin)) return null;

  const now = new Date(localtime);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Determine which window we're in and the arc's endpoints
  let mode, startMin, endMin, eventLabel, countdownTo;
  if (nowMin < sunriseMin) {
    // Pre-dawn: night running from (approx) yesterday's sunset to today's sunrise
    mode = 'night';
    startMin = sunsetMin - 1440;
    endMin = sunriseMin;
    eventLabel = 'Sunrise';
    countdownTo = sunriseMin;
  } else if (nowMin <= sunsetMin) {
    // Daytime
    mode = 'day';
    startMin = sunriseMin;
    endMin = sunsetMin;
    eventLabel = 'Sunset';
    countdownTo = sunsetMin;
  } else {
    // Evening: night from today's sunset to tomorrow's sunrise
    mode = 'night';
    startMin = sunsetMin;
    const nextSunrise = (nextAstro ? parseTime(nextAstro.sunrise) : sunriseMin) + 1440;
    endMin = Number.isNaN(nextSunrise) ? sunriseMin + 1440 : nextSunrise;
    eventLabel = 'Sunrise';
    countdownTo = endMin;
  }

  const progress = endMin > startMin ? clamp((nowMin - startMin) / (endMin - startMin), 0, 1) : 0;

  let remaining = countdownTo - nowMin;
  if (remaining < 0) remaining += 1440;
  const countdownText = fmtDuration(remaining);

  // Endpoint labels — text alone disambiguates; icons added no info.
  const eveningNight = mode === 'night' && nowMin > sunsetMin;
  const leftLabel = mode === 'day' ? 'Sunrise' : 'Sunset';
  const rightLabel = mode === 'day' ? 'Sunset' : 'Sunrise';
  const leftTime = mode === 'day' ? astro.sunrise : astro.sunset;
  const rightTime =
    mode === 'day'
      ? astro.sunset
      : eveningNight && nextAstro
        ? nextAstro.sunrise
        : astro.sunrise;

  const headlineIcon = mode === 'day' ? SUN_ICONS.sunset : SUN_ICONS.sunrise;
  const daylight = mode === 'day' ? fmtDuration(sunsetMin - sunriseMin) : null;

  return (
    <div className="sun-timeline">
      <div className="sun-headline">
        <img className="sun-headline-icon" src={headlineIcon} alt="" />
        <span className="sun-headline-text">
          {eventLabel} in <strong>{countdownText}</strong>
        </span>
      </div>

      <div className="sun-track">
        <div className="sun-arc" />
        <div className="sun-fill" style={{ width: `${progress * 100}%` }} />
        <div className={`sun-dot${mode === 'night' ? ' night' : ''}`} style={{ left: `${progress * 100}%` }} />
      </div>

      <div className="sun-labels">
        <span className="sun-label sun-label--left">
          <span className="sun-label-name">{leftLabel}</span>
          <span className="sun-label-time">{leftTime}</span>
        </span>
        <span className="sun-label sun-label--right">
          <span className="sun-label-name">{rightLabel}</span>
          <span className="sun-label-time">{rightTime}</span>
        </span>
      </div>

      {daylight && <p className="sun-daylight">{daylight} of daylight</p>}
    </div>
  );
}
