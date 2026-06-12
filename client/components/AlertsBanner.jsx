import { useState } from 'react';

// WeatherAPI CAP severity → visual tone. Extreme/Severe read as danger (red),
// Moderate as warning (amber), everything else as advisory (yellow).
const SEVERITY_RANK = { Extreme: 4, Severe: 3, Moderate: 2, Minor: 1, Unknown: 0 };

function severityTone(severity) {
  const s = (severity || '').toLowerCase();
  if (s === 'extreme' || s === 'severe') return 'severe';
  if (s === 'moderate') return 'moderate';
  return 'advisory';
}

// "2026-06-13 17:00" / ISO → "Jun 13, 5:00 PM" (drops year, calmer headline)
function formatWhen(raw) {
  if (!raw) return '';
  const d = new Date(raw.replace(' ', 'T'));
  if (isNaN(d)) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AlertsBanner({ alerts }) {
  const [dismissed, setDismissed] = useState(false);
  const [openIdx, setOpenIdx] = useState(0); // first alert expanded by default

  const list = alerts?.alert || [];
  if (list.length === 0 || dismissed) return null;

  // Most severe first so the banner leads with what matters
  const sorted = [...list].sort(
    (a, b) => (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0)
  );
  const tone = severityTone(sorted[0].severity);

  return (
    <div className={`alerts-banner tone-${tone}`} role="alert">
      <div className="alerts-banner-head">
        <svg className="alerts-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="alerts-banner-title">
          {sorted.length === 1
            ? 'Weather Alert'
            : `${sorted.length} Weather Alerts`}
        </span>
        <button
          className="alerts-dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss alerts"
          title="Dismiss"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <ul className="alerts-list">
        {sorted.map((alert, i) => {
          const isOpen = openIdx === i;
          const itemTone = severityTone(alert.severity);
          const title = alert.event || alert.headline || 'Weather alert';
          const window = [formatWhen(alert.effective), formatWhen(alert.expires)]
            .filter(Boolean)
            .join(' → ');
          return (
            <li key={`${title}-${alert.effective || i}`} className={`alert-item tone-${itemTone}`}>
              <button
                className="alert-summary"
                onClick={() => setOpenIdx(isOpen ? -1 : i)}
                aria-expanded={isOpen}
              >
                <span className="alert-summary-text">
                  <span className="alert-event">{title}</span>
                  {alert.areas && <span className="alert-areas">{alert.areas}</span>}
                </span>
                {alert.severity && (
                  <span className="alert-severity">{alert.severity}</span>
                )}
                <svg className={`alert-chevron${isOpen ? ' open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isOpen && (
                <div className="alert-detail">
                  {alert.headline && alert.headline !== title && (
                    <p className="alert-headline">{alert.headline}</p>
                  )}
                  {window && <p className="alert-window">{window}</p>}
                  {alert.desc && <p className="alert-desc">{alert.desc.trim()}</p>}
                  {alert.instruction && (
                    <p className="alert-instruction">{alert.instruction.trim()}</p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
