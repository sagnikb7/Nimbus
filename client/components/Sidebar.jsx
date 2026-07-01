export default function Sidebar({ cities, weatherData, activeKey, onSelect, onRemove, onTogglePin, tempUnit }) {
  // Show a region qualifier only when two saved cities share the same name
  const nameCounts = cities.reduce((acc, c) => {
    acc[c.name] = (acc[c.name] || 0) + 1;
    return acc;
  }, {});

  return (
    <nav className="dock">
      <div className="dock-track">
        {cities.map((city) => {
          const w = weatherData[city.key];
          const temp = w ? Math.round(w.current.temp[tempUnit]) : null;
          const isActive = activeKey != null && activeKey === city.key;
          const qualifier =
            nameCounts[city.name] > 1 ? city.region || city.country : null;

          return (
            <button
              key={city.key ?? city.query}
              className={`dock-item${isActive ? ' active' : ''}${city.pinned ? ' pinned' : ''}`}
              onClick={() => onSelect(city.key)}
            >
              <span
                className={`dock-pin${city.pinned ? ' is-pinned' : ''}`}
                role="button"
                tabIndex={0}
                title={city.pinned ? 'Unpin (allow FIFO eviction)' : 'Pin (keep in dock)'}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(city.key);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onTogglePin(city.key);
                  }
                }}
              >
                <svg viewBox="0 0 16 16" fill={city.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 14l-4-3-4 3V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v11z" />
                </svg>
              </span>
              <span className="dock-city">
                {city.name}
                {qualifier && <span className="dock-region">{qualifier}</span>}
              </span>
              <span className="dock-temp">
                {temp !== null ? `${temp}°` : '…'}
              </span>
              <span
                className="dock-remove"
                role="button"
                tabIndex={0}
                title="Remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(city.key);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    onRemove(city.key);
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
