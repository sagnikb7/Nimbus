import { calculateAQI, getAQILevel, getAQILevelFromEpa } from '../utils/aqiUtils';

export default function WeatherDetails({ current, onWindClick, onAQIClick }) {
  const aq = current.air_quality;
  const result = aq ? calculateAQI(aq) : null;
  const epa = aq?.['us-epa-index'];

  // Prefer calculated numeric AQI; fall back to EPA category index
  const numericAqi = result?.aqi;
  const aqiLevel = numericAqi != null
    ? getAQILevel(numericAqi)
    : epa != null ? getAQILevelFromEpa(epa) : null;
  const pillValue = numericAqi != null ? numericAqi : aqiLevel?.label;

  const details = [
    // Interactive metrics first — highest user value
    ...(aqiLevel ? [{ label: 'AQI', value: pillValue, onClick: onAQIClick }] : []),
    { label: 'Wind', value: `${current.wind_kph} km/h`, onClick: onWindClick },
    // Core conditions
    { label: 'Humidity', value: `${current.humidity}%` },
    { label: 'UV Index', value: current.uv },
    { label: 'Precip', value: `${current.precip_mm} mm` },
    { label: 'Visibility', value: `${current.vis_km} km` },
    { label: 'Pressure', value: `${current.pressure_mb} hPa` },
  ];

  // Alert bar threshold: numeric AQI > 100 or EPA category >= 3
  const showAlert = aqiLevel && ((numericAqi != null && numericAqi > 100) || (numericAqi == null && epa >= 3));

  return (
    <div className="details-carousel">
      <div className="details-track">
        {details.map((d, i) => (
          <div
            className={`detail-pill${d.onClick ? ' detail-pill--interactive' : ''}`}
            key={d.label}
            style={{ animationDelay: `${i * 60}ms` }}
            onClick={d.onClick || undefined}
            role={d.onClick ? 'button' : undefined}
            tabIndex={d.onClick ? 0 : undefined}
            onKeyDown={d.onClick ? (e) => { if (e.key === 'Enter') d.onClick(); } : undefined}
          >
            <span className="detail-pill-value">{d.value}</span>
            <span className="detail-pill-label">{d.label}</span>
          </div>
        ))}
      </div>

      {/* Compact alert bar — only for concerning AQI */}
      {showAlert && (
        <div
          className="aqi-alert"
          onClick={onAQIClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onAQIClick(); }}
        >
          <span className="aqi-alert-dot" style={{ background: aqiLevel.color }} />
          <span className="aqi-alert-text">
            Air quality is {aqiLevel.label.toLowerCase()}
            {numericAqi != null ? ` (AQI ${numericAqi})` : ''}
          </span>
          <span className="aqi-alert-action">View details</span>
        </div>
      )}
    </div>
  );
}
