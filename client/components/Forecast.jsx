import { getWeatherIcon } from '../utils/weatherIcon';

export default function Forecast({ days, tempUnit }) {
  const hi = tempUnit === 'c' ? 'maxtemp_c' : 'maxtemp_f';
  const lo = tempUnit === 'c' ? 'mintemp_c' : 'mintemp_f';

  // Global temp range across all visible days, used to scale each row's bar
  const globalMin = Math.min(...days.map((d) => d.day[lo]));
  const globalMax = Math.max(...days.map((d) => d.day[hi]));
  const range = Math.max(1, globalMax - globalMin);

  return (
    <div className="forecast">
      <h3 className="forecast-title">3-Day Forecast</h3>
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

          const iconUrl = getWeatherIcon(day.day.condition.code, 1);
          const dayHi = Math.round(day.day[hi]);
          const dayLo = Math.round(day.day[lo]);

          // Position of this day's hi/lo slice within the 3-day range
          const fillStart = ((day.day[lo] - globalMin) / range) * 100;
          const fillEnd = ((day.day[hi] - globalMin) / range) * 100;

          // Chips — only when meaningful
          const precip = Math.max(
            day.day.daily_chance_of_rain || 0,
            day.day.daily_chance_of_snow || 0
          );
          const wind = Math.round(day.day.maxwind_kph || 0);
          const uv = Math.round(day.day.uv || 0);
          const snow = day.day.totalsnow_cm || 0;
          const hasChips = precip >= 30 || wind >= 25 || uv >= 6 || snow > 0;

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
                alt={day.day.condition.text}
              />

              <div className="forecast-mid">
                <span className="forecast-condition">{day.day.condition.text}</span>
                {hasChips && (
                  <div className="forecast-chips">
                    {precip >= 30 && (
                      <span className="forecast-chip" title="Chance of precipitation">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 2.5s4 4.5 4 7.5a4 4 0 1 1-8 0c0-3 4-7.5 4-7.5z" />
                        </svg>
                        {precip}%
                      </span>
                    )}
                    {wind >= 25 && (
                      <span className="forecast-chip" title="Max wind">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 6h8a2 2 0 1 0-2-2" />
                          <path d="M2 10h11a2 2 0 1 1-2 2" />
                        </svg>
                        {wind}
                      </span>
                    )}
                    {uv >= 6 && (
                      <span className="forecast-chip" title="UV index">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="8" cy="8" r="2.5" />
                          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.4 1.4M11.55 11.55l1.4 1.4M3.05 12.95l1.4-1.4M11.55 4.45l1.4-1.4" />
                        </svg>
                        UV {uv}
                      </span>
                    )}
                    {snow > 0 && (
                      <span className="forecast-chip" title="Snow">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 1v14M2 4l12 8M2 12l12-8" />
                        </svg>
                        {snow}cm
                      </span>
                    )}
                  </div>
                )}
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
