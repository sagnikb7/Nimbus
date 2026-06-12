import { useState, useEffect } from 'react';
import useAnimatedNumber from '../hooks/useAnimatedNumber';
import { getWeatherIcon } from '../utils/weatherIcon';

// Live clock in the city's own timezone, so users can relate the sunrise/sunset
// bar to "now" regardless of their own location. Ticks every 30s.
function useCityClock(tzId, fallbackLocaltime) {
  const format = () => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tzId,
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date());
    } catch {
      const t = fallbackLocaltime?.split(' ')[1];
      if (!t) return '';
      let [h, m] = t.split(':').map(Number);
      const ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${String(m).padStart(2, '0')} ${ap}`;
    }
  };
  const [time, setTime] = useState(format);
  useEffect(() => {
    setTime(format());
    const id = setInterval(() => setTime(format()), 30_000);
    return () => clearInterval(id);
  }, [tzId, fallbackLocaltime]);
  return time;
}

export default function CurrentWeather({ data, tempUnit }) {
  const { location, current } = data;
  const u = tempUnit === 'c' ? 'temp_c' : 'temp_f';
  const fu = tempUnit === 'c' ? 'feelslike_c' : 'feelslike_f';

  const date = new Date(location.localtime);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const formatted = `${weekday} · ${monthDay}`;

  const iconUrl = getWeatherIcon(current.condition.code, current.is_day);

  // High / low from today's forecast (data already includes 3-day forecast)
  const today = data.forecast?.forecastday?.[0]?.day;
  const hi = today ? Math.round(today[tempUnit === 'c' ? 'maxtemp_c' : 'maxtemp_f']) : null;
  const lo = today ? Math.round(today[tempUnit === 'c' ? 'mintemp_c' : 'mintemp_f']) : null;

  const localTime = useCityClock(location.tz_id, location.localtime);

  const animTemp = useAnimatedNumber(Math.round(current[u]));
  const animFeels = useAnimatedNumber(Math.round(current[fu]));

  return (
    <div className="current-weather">
      <div className="current-location">
        <h2 className="current-city">{location.name}</h2>
        <p className="current-region">
          {[location.region, location.country].filter(Boolean).join(', ')}
        </p>
        <p className="current-date">{formatted}</p>
        {localTime && (
          <div className="current-clock" title="Local time">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15.5 14" />
            </svg>
            <span>{localTime} local</span>
          </div>
        )}
      </div>

      <div className="current-temp-group">
        <div className="current-temp">
          <span className="current-temp-value">{animTemp}</span>
          <span className="current-temp-deg">&deg;</span>
        </div>

        <div className="current-condition">
          <img src={iconUrl} alt={current.condition.text} />
          <span>{current.condition.text}</span>
        </div>

        <div className="current-stats">
          {hi !== null && (
            <span className="current-stat" title="High">
              <svg className="current-stat-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-label="High">
                <path d="M8 13V3" />
                <path d="M4 7l4-4 4 4" />
              </svg>
              <span className="current-stat-val">{hi}&deg;</span>
            </span>
          )}
          {hi !== null && <span className="current-stat-sep" />}
          <span className="current-stat current-stat--accent">
            <span className="current-stat-key">Feels</span>
            <span className="current-stat-val">{animFeels}&deg;</span>
          </span>
          {lo !== null && <span className="current-stat-sep" />}
          {lo !== null && (
            <span className="current-stat" title="Low">
              <svg className="current-stat-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-label="Low">
                <path d="M8 3v10" />
                <path d="M4 9l4 4 4-4" />
              </svg>
              <span className="current-stat-val">{lo}&deg;</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
