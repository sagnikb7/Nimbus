import { useState, useRef, useEffect } from 'react';
import CloseButton from './CloseButton';

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 10; // px — moving more than this cancels the press (it's a scroll)

export default function Sidebar({ cities, weatherData, activeKey, onSelect, onRemove, onTogglePin, tempUnit }) {
  // Show a region qualifier only when two saved cities share the same name
  const nameCounts = cities.reduce((acc, c) => {
    acc[c.name] = (acc[c.name] || 0) + 1;
    return acc;
  }, {});

  // Touch devices get a long-press action sheet; pointer devices keep the
  // hover-revealed inline pin/✕ controls (hidden on coarse pointers via CSS).
  const [isCoarse] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches
  );
  const [menuCity, setMenuCity] = useState(null);
  const [hintSeen, setHintSeen] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('dockHintSeen') === '1'
  );

  const timer = useRef(null);
  const fired = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  function dismissHint() {
    setHintSeen(true);
    try { localStorage.setItem('dockHintSeen', '1'); } catch { /* ignore quota */ }
  }

  const clearTimer = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  };

  function onTouchStart(e, city) {
    fired.current = false;
    const t = e.touches[0];
    startPos.current = { x: t.clientX, y: t.clientY };
    clearTimer();
    timer.current = setTimeout(() => {
      fired.current = true;
      timer.current = null;
      navigator.vibrate?.(10);
      setMenuCity(city);
      dismissHint();
    }, LONG_PRESS_MS);
  }

  function onTouchMove(e) {
    if (!timer.current) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - startPos.current.x) > MOVE_TOLERANCE ||
        Math.abs(t.clientY - startPos.current.y) > MOVE_TOLERANCE) {
      clearTimer();
    }
  }

  function handleSelect(city) {
    // Suppress the click that follows a long-press (the menu already opened).
    if (fired.current) { fired.current = false; return; }
    onSelect(city.key);
  }

  // Escape + scroll-lock while the action sheet is open.
  useEffect(() => {
    if (!menuCity) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuCity(null); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [menuCity]);

  const menuQualifier = menuCity && nameCounts[menuCity.name] > 1
    ? (menuCity.region || menuCity.country)
    : null;

  return (
    <nav className="dock">
      {isCoarse && !hintSeen && cities.length > 0 && (
        <div className="dock-hint" role="status">
          <span>Press &amp; hold a city to pin or remove</span>
          <button className="dock-hint-close" onClick={dismissHint} aria-label="Dismiss tip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}

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
              onClick={() => handleSelect(city)}
              onTouchStart={(e) => onTouchStart(e, city)}
              onTouchMove={onTouchMove}
              onTouchEnd={clearTimer}
              onTouchCancel={clearTimer}
              onContextMenu={(e) => { if (isCoarse) e.preventDefault(); }}
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
                aria-label={`Remove ${city.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(city.key);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onRemove(city.key);
                  }
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </span>
            </button>
          );
        })}
      </div>

      {menuCity && (
        <div className="dock-sheet-overlay" onClick={() => setMenuCity(null)}>
          <div
            className="dock-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`Options for ${menuCity.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="dock-sheet-grip" aria-hidden="true" />
            <div className="dock-sheet-header">
              <div className="dock-sheet-title">
                {menuCity.name}
                {menuQualifier && <span className="dock-sheet-region">{menuQualifier}</span>}
              </div>
              <CloseButton className="dock-sheet-close" onClick={() => setMenuCity(null)} label="Close" />
            </div>
            <button
              className="dock-sheet-action"
              onClick={() => { onTogglePin(menuCity.key); setMenuCity(null); }}
            >
              <svg viewBox="0 0 24 24" fill={menuCity.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span>{menuCity.pinned ? 'Unpin' : 'Pin to keep'}</span>
              <svg className="dock-sheet-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button
              className="dock-sheet-action danger"
              onClick={() => { onRemove(menuCity.key); setMenuCity(null); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>Remove</span>
              <svg className="dock-sheet-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
