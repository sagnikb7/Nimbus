export default function SunriseSunset({ astro, localtime }) {
  function parseTime(str) {
    const [time, period] = str.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }

  const sunrise = parseTime(astro.sunrise);
  const sunset = parseTime(astro.sunset);
  const now = new Date(localtime);
  const current = now.getHours() * 60 + now.getMinutes();

  const dayLength = sunset - sunrise;
  const progress = dayLength > 0 ? Math.max(0, Math.min(1, (current - sunrise) / dayLength)) : 0;
  const isDaytime = current >= sunrise && current <= sunset;

  return (
    <div className="sun-timeline">
      <div className="sun-labels">
        <span className="sun-label">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="10" cy="12" r="3.5" />
            <line x1="10" y1="4" x2="10" y2="6" />
            <line x1="10" y1="18" x2="10" y2="16" />
            <line x1="4" y1="12" x2="6" y2="12" />
            <line x1="14" y1="12" x2="16" y2="12" />
            <line x1="5.76" y1="7.76" x2="7.17" y2="9.17" />
            <line x1="12.83" y1="14.83" x2="14.24" y2="16.24" />
            <line x1="5.76" y1="16.24" x2="7.17" y2="14.83" />
            <line x1="12.83" y1="9.17" x2="14.24" y2="7.76" />
          </svg>
          {astro.sunrise}
        </span>
        <span className="sun-label">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 14a4 4 0 1 1 0-8" />
            <line x1="2" y1="14" x2="18" y2="14" />
          </svg>
          {astro.sunset}
        </span>
      </div>
      <div className="sun-track">
        <div className="sun-arc" />
        <div
          className="sun-fill"
          style={{ width: `${progress * 100}%` }}
        />
        {isDaytime && (
          <div
            className="sun-dot"
            style={{ left: `${progress * 100}%` }}
          >
            <div className="sun-dot-glow" />
          </div>
        )}
      </div>
    </div>
  );
}
