export default function Forecast({ days, tempUnit }) {
  const hi = tempUnit === 'c' ? 'maxtemp_c' : 'maxtemp_f';
  const lo = tempUnit === 'c' ? 'mintemp_c' : 'mintemp_f';

  return (
    <div className="forecast">
      <h3 className="forecast-title">3-Day Forecast</h3>
      <div className="forecast-list">
        {days.map((day, i) => {
          const date = new Date(day.date + 'T00:00:00');
          const label =
            i === 0
              ? 'Today'
              : date.toLocaleDateString('en-US', { weekday: 'short' });

          const icon = day.day.condition.icon;
          const iconUrl = icon.startsWith('//') ? `https:${icon}` : icon;

          return (
            <div
              className="forecast-row"
              key={day.date}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="forecast-day">{label}</span>
              <img className="forecast-icon" src={iconUrl} alt={day.day.condition.text} />
              <span className="forecast-condition">{day.day.condition.text}</span>
              <div className="forecast-temps">
                <span className="forecast-high">{Math.round(day.day[hi])}&deg;</span>
                <span className="forecast-low">{Math.round(day.day[lo])}&deg;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
