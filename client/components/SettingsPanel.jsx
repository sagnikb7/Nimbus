import useOverlayDismiss from '../hooks/useOverlayDismiss';
import CloseButton from './CloseButton';
import CloudMark from './CloudMark';

// Icons kept inline so the panel is self-contained (stroke = currentColor).
const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const SystemIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M8 20h8M12 16v4" />
  </svg>
);

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: SystemIcon },
];

const UNIT_OPTIONS = [
  { value: 'c', label: '°C' },
  { value: 'f', label: '°F' },
];

const FEATURES = [
  'Live conditions with feels-like, humidity, wind & UV',
  'Hourly and multi-day forecasts',
  'Air quality (US AQI) and detailed wind insights',
  'Sunrise / sunset with a live local clock',
  'Saved cities, dark/light themes, shareable cards',
  'Installable PWA — fast, offline-ready',
];

function Segmented({ label, ariaLabel, value, options, onChange }) {
  return (
    <div className="settings-row">
      <span className="settings-row-label">{label}</span>
      <div className="segmented" role="group" aria-label={ariaLabel}>
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              className={`segmented-option${active ? ' is-active' : ''}`}
              aria-pressed={active}
              onClick={() => onChange(o.value)}
            >
              {o.Icon && <o.Icon />}
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Friendly capability list for a provider descriptor (from /api/providers).
function providerFeatures(p) {
  const f = [`${p.forecastDays}-day forecast`];
  if (p.supportsAlerts) f.push('Severe weather alerts');
  if (p.supportsAirQuality) f.push('Air quality (US AQI)');
  if (p.supportsCloudCover) f.push('Cloud cover');
  if (p.supportsMoonPhase) f.push('Moon phase');
  if (!p.keyRequired) f.push('No API key required');
  return f;
}

export default function SettingsPanel({
  themePref, onThemeChange,
  tempUnit, onUnitChange,
  providers = [], weatherProvider, onProviderChange, providerSwitching,
  onClose,
}) {
  const available = providers.filter((p) => p.available);
  const selected = providers.find((p) => p.id === weatherProvider);

  useOverlayDismiss(onClose);

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="settings-header">
          <span className="settings-title">Settings</span>
          <CloseButton className="settings-close" onClick={onClose} label="Close settings" />
        </div>

        <section className="settings-section">
          <h3 className="settings-label">Appearance</h3>
          <div className="settings-card">
            <Segmented
              label="Theme"
              ariaLabel="Theme"
              value={themePref}
              options={THEME_OPTIONS}
              onChange={onThemeChange}
            />
          </div>
        </section>

        <section className="settings-section">
          <h3 className="settings-label">Units</h3>
          <div className="settings-card">
            <Segmented
              label="Temperature"
              ariaLabel="Temperature unit"
              value={tempUnit}
              options={UNIT_OPTIONS}
              onChange={onUnitChange}
            />
          </div>
        </section>

        {available.length > 0 && (
          <section className="settings-section">
            <h3 className="settings-label">Data provider</h3>
            <div className="settings-card">
              <div className="settings-row">
                <span className="settings-row-label">Source</span>
                <div className="segmented" role="group" aria-label="Data provider">
                  {available.map((p) => {
                    const active = weatherProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`segmented-option${active ? ' is-active' : ''}`}
                        aria-pressed={active}
                        onClick={() => onProviderChange(p.id)}
                      >
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selected && (
                <div className="settings-provider-features">
                  <span className="settings-provider-includes">{selected.label} includes</span>
                  <ul className="settings-about-features">
                    {providerFeatures(selected).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  {providerSwitching && (
                    <p className="settings-refreshing">Refreshing your cities…</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="settings-section">
          <h3 className="settings-label">About</h3>
          <div className="settings-card settings-about">
            <div className="settings-about-head">
              <span className="settings-about-mark" aria-hidden="true">
                <CloudMark />
              </span>
              <div>
                <div className="settings-about-name">
                  Nimbus <span className="settings-about-version">v{__APP_VERSION__}</span>
                </div>
                <p className="settings-about-tagline">Beautiful, fast weather with a native feel.</p>
              </div>
            </div>

            <ul className="settings-about-features">
              {FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>

            <p className="settings-about-credit">
              Weather by Open-Meteo &amp; WeatherAPI.com · Geocoding by Open-Meteo (CC-BY 4.0).
            </p>

            <div className="settings-about-footer">
              <a
                className="settings-about-link"
                href="https://github.com/sagnikb7/Nimbus"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.46-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 2.5-.34c.85 0 1.71.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
                </svg>
                View on GitHub
              </a>
              <p className="settings-made">
                Made with
                <svg className="settings-heart" viewBox="0 0 24 24" fill="currentColor" aria-label="love">
                  <path d="M12 21s-7.5-4.9-10-9.2C.6 9.1 1.6 5.6 4.7 4.7c2-.6 3.9.4 4.9 1.9L12 9l2.4-2.4c1-1.5 2.9-2.5 4.9-1.9 3.1.9 4.1 4.4 2.7 7.1C19.5 16.1 12 21 12 21z" />
                </svg>
                by Sagnik
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
