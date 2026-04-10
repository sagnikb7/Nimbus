import { getAQILevel } from '../utils/aqiUtils';

export default function AirQuality({ airQuality }) {
  if (!airQuality) return null;

  const epa = airQuality['us-epa-index'];
  const level = getAQILevel(epa);

  const pollutants = [
    { label: 'PM2.5', value: airQuality.pm2_5, unit: 'μg/m³' },
    { label: 'PM10', value: airQuality.pm10, unit: 'μg/m³' },
    { label: 'O₃', value: airQuality.o3, unit: 'μg/m³' },
    { label: 'NO₂', value: airQuality.no2, unit: 'μg/m³' },
    { label: 'CO', value: airQuality.co, unit: 'μg/m³' },
    { label: 'SO₂', value: airQuality.so2, unit: 'μg/m³' },
  ].filter((p) => p.value != null);

  return (
    <div className="air-quality">
      <div className="aqi-header">
        <span className="aqi-title">Air Quality</span>
        <span className={`aqi-badge ${level.className}`}>{level.label}</span>
      </div>
      <div className="details-track">
        {pollutants.map((p, i) => (
          <div className="detail-pill" key={p.label} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="detail-pill-value">{Math.round(p.value * 10) / 10}</span>
            <span className="detail-pill-label">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
