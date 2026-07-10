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

export default function CurrentWeather({ data, tempUnit, freshness }) {
  const { location, current } = data;

  const date = new Date(location.localtime);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const formatted = `${weekday} · ${monthDay}`;

  const iconUrl = getWeatherIcon(current.condition.id, current.is_day);

  // High / low from today's forecast (data already includes 3-day forecast)
  const today = data.daily?.[0];
  const hi = today ? Math.round(today.high[tempUnit]) : null;
  const lo = today ? Math.round(today.low[tempUnit]) : null;

  const localTime = useCityClock(location.timezone, location.localtime);

  const animTemp = useAnimatedNumber(Math.round(current.temp[tempUnit]));
  const animFeels = useAnimatedNumber(Math.round(current.feels_like[tempUnit]));

  return (
    <div className="current-weather">
      <div className="current-location">
        <h2 className="current-city">{location.name}</h2>
        <p className="current-region">
          {[location.region, location.country].filter(Boolean).join(', ')}
        </p>
        <p className="current-meta">
          <span className="current-date">{formatted}</span>
          {localTime && (
            <span className="current-clock" title="Local time">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15.5 14" />
              </svg>
              {localTime} local
            </span>
          )}
        </p>
      </div>

      <div className="current-main">
        <div className="current-temp">
          <span className="current-temp-value">{animTemp}</span>
          <span className="current-temp-deg">&deg;</span>
        </div>

        <div className="current-side">
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
            <span className="current-stat current-stat--accent" title="Feels like">
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

      <div className="current-params">
        <span className="current-param" title="Humidity">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2.7s6 6.6 6 10.8a6 6 0 0 1-12 0C6 9.3 12 2.7 12 2.7z" />
          </svg>
          <span className="current-param-val">{current.humidity}%</span>
          <span className="current-param-key">Humidity</span>
        </span>
        <span className="current-param" title="Wind">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5" />
            <path d="M3 12h15a2.5 2.5 0 1 1-2.5 2.5" />
            <path d="M3 16h7a2 2 0 1 1-2 2" />
          </svg>
          <span className="current-param-val">{Math.round(current.wind.speed_kph)}</span>
          <span className="current-param-key">km/h {current.wind.dir}</span>
        </span>
      </div>

      {freshness && <div className="current-freshness">{freshness}</div>}
    </div>
  );
}
