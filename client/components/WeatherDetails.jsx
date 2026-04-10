export default function WeatherDetails({ current }) {
  const details = [
    { label: 'Humidity', value: `${current.humidity}%` },
    { label: 'Wind', value: `${current.wind_kph} km/h` },
    { label: 'UV Index', value: current.uv },
    { label: 'Pressure', value: `${current.pressure_mb} hPa` },
    { label: 'Visibility', value: `${current.vis_km} km` },
    { label: 'Precip', value: `${current.precip_mm} mm` },
  ];

  return (
    <div className="details-carousel">
      <div className="details-track">
        {details.map((d, i) => (
          <div className="detail-pill" key={d.label} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="detail-pill-value">{d.value}</span>
            <span className="detail-pill-label">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
