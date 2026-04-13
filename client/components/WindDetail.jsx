import { useState, useEffect } from 'react';
import useAnimatedNumber from '../hooks/useAnimatedNumber';
import {
  WIND_CATEGORIES,
  getWindCategory,
  getHourlyWind,
  getPrevailingDirection,
  getGustAssessment,
  getPeakWindHour,
  getWindSummary,
} from '../utils/windUtils';

function CompassArrow({ degree }) {
  return (
    <svg className="wind-compass" viewBox="0 0 120 120">
      {/* Outer ring */}
      <circle cx="60" cy="60" r="54" fill="none" stroke="var(--glass-border)" strokeWidth="1.5" />
      {/* Tick marks at N, E, S, W */}
      <line x1="60" y1="8" x2="60" y2="16" stroke="var(--text-3)" strokeWidth="1.5" />
      <line x1="112" y1="60" x2="104" y2="60" stroke="var(--text-3)" strokeWidth="1.5" />
      <line x1="60" y1="112" x2="60" y2="104" stroke="var(--text-3)" strokeWidth="1.5" />
      <line x1="8" y1="60" x2="16" y2="60" stroke="var(--text-3)" strokeWidth="1.5" />
      {/* Cardinal labels */}
      <text x="60" y="26" textAnchor="middle" fill="var(--text-2)" fontSize="9" fontWeight="600">N</text>
      <text x="98" y="63" textAnchor="middle" fill="var(--text-3)" fontSize="8">E</text>
      <text x="60" y="100" textAnchor="middle" fill="var(--text-3)" fontSize="8">S</text>
      <text x="22" y="63" textAnchor="middle" fill="var(--text-3)" fontSize="8">W</text>
      {/* Direction arrow — rotated to wind_degree (direction wind comes FROM) */}
      <g transform={`rotate(${degree} 60 60)`}>
        <line x1="60" y1="22" x2="60" y2="72" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
        <polygon points="60,18 54,30 66,30" fill="var(--accent)" />
      </g>
      {/* Center dot */}
      <circle cx="60" cy="60" r="3" fill="var(--accent)" />
    </svg>
  );
}

function formatHour(timeStr) {
  const h = new Date(timeStr).getHours();
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

const EDU_BLOCKS = [
  {
    title: 'Sustained Wind',
    body: 'The average wind speed measured over a period (usually 2 minutes). This is the "steady" wind you feel consistently.',
  },
  {
    title: 'Gusts',
    body: 'Brief bursts of wind that exceed the sustained speed. Gusts can be 30-50% stronger and are what make wind feel unpredictable.',
  },
  {
    title: 'Wind Direction',
    body: 'Always reported as where the wind is coming FROM. A "north wind" blows from north to south. Think of it as facing into the wind.',
  },
  {
    title: 'Compass Degrees',
    body: '0\u00b0 = North, 90\u00b0 = East, 180\u00b0 = South, 270\u00b0 = West. The arrow on the compass points toward the direction the wind originates from.',
  },
  {
    title: 'Why Wind Matters',
    body: 'Wind affects how cold it feels (wind chill), pollen and pollution spread, outdoor activities like cycling or sailing, and flight delays. Even moderate wind can make a warm day feel chilly.',
  },
];

export default function WindDetail({ current, forecastDays, localtime, onClose }) {
  const [eduOpen, setEduOpen] = useState(false);

  const category = getWindCategory(current.wind_kph);
  const hourlyWind = getHourlyWind(forecastDays, localtime);
  const summary = getWindSummary(current, forecastDays, localtime);
  const gustInfo = getGustAssessment(current.wind_kph, current.gust_kph);
  const peakHour = getPeakWindHour(forecastDays);
  const prevailingDir = getPrevailingDirection(forecastDays);
  const todayMax = forecastDays?.[0]?.day?.maxwind_kph;
  const gustDelta = Math.round((current.gust_kph || 0) - (current.wind_kph || 0));

  const animSpeed = useAnimatedNumber(Math.round(current.wind_kph));
  const animGust = useAnimatedNumber(Math.round(current.gust_kph || 0));

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="wind-overlay" onClick={onClose}>
      <div
        className="wind-detail"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Wind Details"
      >
        {/* Header */}
        <div className="wind-detail-header">
          <span className="wind-detail-title">Wind Details</span>
          <button className="wind-detail-close" onClick={onClose} aria-label="Close wind details">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Hero */}
        <div className="wind-hero">
          <div className="wind-hero-main">
            <span className="wind-hero-speed">{animSpeed}</span>
            <span className="wind-hero-unit">km/h</span>
          </div>
          <div className="wind-hero-meta">
            <span className="wind-hero-dir-badge">{current.wind_dir}</span>
            <span className="wind-hero-deg">{current.wind_degree}&deg;</span>
          </div>
          <CompassArrow degree={current.wind_degree} />
          <span className="wind-hero-category">{category.label}</span>
          <span className="wind-hero-desc">{category.description}</span>
        </div>

        {/* Gust card */}
        <div className="wind-card">
          <div className="wind-card-header">
            <span className="wind-section-title">Gusts</span>
            <span className={`wind-gust-badge wind-gust-${gustInfo.severity}`}>{gustInfo.severity}</span>
          </div>
          <div className="wind-gust-row">
            <div className="wind-gust-stat">
              <span className="wind-stat-value">{animGust} km/h</span>
              <span className="wind-stat-label">Current Gust</span>
            </div>
            <div className="wind-gust-stat">
              <span className="wind-stat-value">+{gustDelta} km/h</span>
              <span className="wind-stat-label">Above Sustained</span>
            </div>
          </div>
          <p className="wind-gust-note">{gustInfo.description}</p>
        </div>

        {/* Category ladder */}
        <div className="wind-card">
          <span className="wind-section-title">Beaufort Scale</span>
          <div className="wind-ladder">
            {WIND_CATEGORIES.map((cat) => {
              const isActive = cat === category;
              const isAbove = WIND_CATEGORIES.indexOf(cat) > WIND_CATEGORIES.indexOf(category);
              return (
                <div
                  className={`wind-ladder-step${isActive ? ' active' : ''}${isAbove ? ' dimmed' : ''}`}
                  key={cat.label}
                >
                  <span className="wind-ladder-label">{cat.label}</span>
                  <span className="wind-ladder-range">
                    {cat.max === Infinity ? `${cat.min}+` : `${cat.min}–${cat.max}`} km/h
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly wind timeline */}
        {hourlyWind.length > 0 && (
          <div className="wind-card">
            <span className="wind-section-title">Hourly Wind</span>
            <div className="wind-hourly-scroll">
              {hourlyWind.map((h, i) => {
                const isNow = i === 0;
                return (
                  <div className={`wind-hourly-item${isNow ? ' now' : ''}`} key={h.time_epoch}>
                    <span className="wind-hourly-time">{isNow ? 'Now' : formatHour(h.time)}</span>
                    <svg className="wind-hourly-arrow" viewBox="0 0 24 24" style={{ transform: `rotate(${h.wind_degree}deg)` }}>
                      <line x1="12" y1="4" x2="12" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <polygon points="12,2 8,10 16,10" fill="currentColor" />
                    </svg>
                    <span className="wind-hourly-speed">{Math.round(h.wind_kph)}</span>
                    <span className="wind-hourly-gust">{Math.round(h.gust_kph)}</span>
                    <span className="wind-hourly-dir">{h.wind_dir}</span>
                  </div>
                );
              })}
            </div>
            <div className="wind-hourly-legend">
              <span>Speed (km/h)</span>
              <span>Gust (km/h)</span>
            </div>
          </div>
        )}

        {/* Daily summary */}
        <div className="wind-card">
          <span className="wind-section-title">Today&apos;s Summary</span>
          <div className="wind-stat-grid">
            <div className="wind-stat-item">
              <span className="wind-stat-value">{todayMax != null ? Math.round(todayMax) : '--'}</span>
              <span className="wind-stat-label">Max Wind (km/h)</span>
            </div>
            <div className="wind-stat-item">
              <span className="wind-stat-value">{peakHour ? formatHour(peakHour.time) : '--'}</span>
              <span className="wind-stat-label">Peak Hour</span>
            </div>
            <div className="wind-stat-item">
              <span className="wind-stat-value">{prevailingDir}</span>
              <span className="wind-stat-label">Prevailing Dir</span>
            </div>
          </div>
        </div>

        {/* Smart summary */}
        <div className="wind-card">
          <span className="wind-section-title">At a Glance</span>
          <p className="wind-summary-text">{summary}</p>
        </div>

        {/* Educational section */}
        <div className="wind-card">
          <button className="wind-edu-toggle" onClick={() => setEduOpen((o) => !o)}>
            Learn about wind
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: eduOpen ? 'rotate(180deg)' : 'none' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {eduOpen && (
            <div className="wind-edu-content">
              {EDU_BLOCKS.map((block) => (
                <div className="wind-edu-block" key={block.title}>
                  <h5 className="wind-edu-title">{block.title}</h5>
                  <p className="wind-edu-body">{block.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
