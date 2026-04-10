export default function HourlyForecast({ forecastDays, localtime, tempUnit }) {
  const now = new Date(localtime);
  const u = tempUnit === 'c' ? 'temp_c' : 'temp_f';

  const hours = [];
  for (const day of forecastDays) {
    for (const hour of day.hour) {
      const hDate = new Date(hour.time);
      const diffMs = hDate - now;
      const diffH = diffMs / (1000 * 60 * 60);
      if (diffH >= -0.5 && diffH <= 24) {
        hours.push(hour);
      }
    }
  }

  const display = hours.slice(0, 24);

  return (
    <div className="hourly">
      <h3 className="hourly-title">Hourly Forecast</h3>
      <div className="hourly-scroll">
        {display.map((h, i) => {
          const hDate = new Date(h.time);
          const hHour = hDate.getHours();
          const isNow = i === 0;
          const label = isNow
            ? 'Now'
            : hHour === 0
              ? '12 AM'
              : hHour < 12
                ? `${hHour} AM`
                : hHour === 12
                  ? '12 PM'
                  : `${hHour - 12} PM`;

          const icon = h.condition.icon;
          const iconUrl = icon.startsWith('//') ? `https:${icon}` : icon;

          return (
            <div className={`hourly-item${isNow ? ' now' : ''}`} key={h.time_epoch}>
              <span className="hourly-time">{label}</span>
              <img className="hourly-icon" src={iconUrl} alt={h.condition.text} />
              <span className="hourly-temp">{Math.round(h[u])}&deg;</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
