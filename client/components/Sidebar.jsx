export default function Sidebar({ cities, weatherData, activeCity, onSelect, onRemove, tempUnit }) {
  const u = tempUnit === 'c' ? 'temp_c' : 'temp_f';

  return (
    <nav className="dock">
      <div className="dock-track">
        {cities.map((city) => {
          const w = weatherData[city];
          const temp = w ? Math.round(w.current[u]) : null;
          const isActive = activeCity === city;

          return (
            <button
              key={city}
              className={`dock-item${isActive ? ' active' : ''}`}
              onClick={() => onSelect(city)}
            >
              <span className="dock-city">{city}</span>
              <span className="dock-temp">
                {temp !== null ? `${temp}\u00B0` : '\u2026'}
              </span>
              <span
                className="dock-remove"
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(city);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    onRemove(city);
                  }
                }}
              >
                &times;
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
