import { getWeatherIcon } from '../utils/weatherIcon';

export default function Forecast({ days, tempUnit }) {
  // Global temp range across all visible days, used to scale each row's bar
  const globalMin = Math.min(...days.map((d) => d.low[tempUnit]));
  const globalMax = Math.max(...days.map((d) => d.high[tempUnit]));
  const range = Math.max(1, globalMax - globalMin);

  return (
    <div className="forecast">
      <h3 className="forecast-title">{days.length}-Day Forecast</h3>
      <div className="forecast-list">
        {days.map((day, i) => {
          const date = new Date(day.date + 'T00:00:00');
          const isToday = i === 0;
          const weekday = isToday
            ? 'Today'
            : date.toLocaleDateString('en-US', { weekday: 'short' });
          const dateLabel = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          const iconUrl = getWeatherIcon(day.condition.id, 1);
          const dayHi = Math.round(day.high[tempUnit]);
          const dayLo = Math.round(day.low[tempUnit]);

          // Position of this day's hi/lo slice within the 3-day range
          const fillStart = ((day.low[tempUnit] - globalMin) / range) * 100;
          const fillEnd = ((day.high[tempUnit] - globalMin) / range) * 100;

          // Two chips only — chance of rain + max wind — the metrics BOTH
          // providers supply for the forecast, so every row is consistent.
          const rain = Math.round(day.chance_of_rain || 0);
          const wind = Math.round(day.max_wind_kph || 0);

          return (
            <div
              className={`forecast-row${isToday ? ' is-today' : ''}`}
              key={day.date}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="forecast-when">
                <span className="forecast-day">{weekday}</span>
                <span className="forecast-date">{dateLabel}</span>
              </div>

              <img
                className="forecast-icon"
                src={iconUrl}
                alt={day.condition.text}
              />

              <div className="forecast-mid">
                <span className="forecast-condition">{day.condition.text}</span>
                <div className="forecast-chips">
                  <span className="forecast-chip" title="Chance of rain">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 2.5s4 4.5 4 7.5a4 4 0 1 1-8 0c0-3 4-7.5 4-7.5z" />
                    </svg>
                    {rain}%
                  </span>
                  <span className="forecast-chip" title="Max wind">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 6h8a2 2 0 1 0-2-2" />
                      <path d="M2 10h11a2 2 0 1 1-2 2" />
                    </svg>
                    {wind} km/h
                  </span>
                </div>
              </div>

              <div className="forecast-temps">
                <span className="forecast-low">{dayLo}&deg;</span>
                <div
                  className="forecast-range"
                  role="img"
                  aria-label={`High ${dayHi}, Low ${dayLo}`}
                >
                  <div
                    className="forecast-range-fill"
                    style={{
                      left: `${fillStart}%`,
                      width: `${Math.max(6, fillEnd - fillStart)}%`,
                    }}
                  />
                </div>
                <span className="forecast-high">{dayHi}&deg;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
