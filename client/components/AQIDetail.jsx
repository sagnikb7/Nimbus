import { useState, useEffect } from 'react';
import useAnimatedNumber from '../hooks/useAnimatedNumber';
import {
  AQI_LEVELS,
  calculateAQI,
  getAQILevel,
  getAQILevelFromEpa,
  getPrimaryPollutant,
  getSortedPollutants,
  getPollutantStatus,
  getAQISummary,
} from '../utils/aqiUtils';

const EDU_BLOCKS = [
  {
    title: 'What is AQI?',
    body: 'The Air Quality Index is a number from 0 to 500 that tells you how clean or polluted the air is. Higher numbers mean worse air quality. It\u2019s calculated from pollutant concentrations using EPA breakpoint tables.',
  },
  {
    title: 'Particulate Matter',
    body: 'PM2.5 (fine particles under 2.5\u03bcm) and PM10 (under 10\u03bcm) are tiny particles suspended in the air. PM2.5 is most concerning because it penetrates deep into lungs and can enter the bloodstream.',
  },
  {
    title: 'Ground-Level Ozone',
    body: "Unlike the protective ozone layer, ground-level ozone (O\u2083) is a harmful pollutant formed when sunlight reacts with vehicle and industrial emissions. It\u2019s typically worse on hot, sunny days.",
  },
  {
    title: 'Sensitive Groups',
    body: 'Children, older adults, people with asthma or heart disease, and those who work or exercise outdoors are more sensitive to air pollution. Even moderate AQI levels can affect these groups.',
  },
  {
    title: 'Protecting Yourself',
    body: 'On poor air quality days: limit outdoor exertion, keep windows closed, use air purifiers if available, and check AQI before planning outdoor activities. N95 masks can filter fine particles.',
  },
];

export default function AQIDetail({ airQuality, onClose }) {
  const [eduOpen, setEduOpen] = useState(false);

  const result = calculateAQI(airQuality);
  const epa = airQuality['us-epa-index'];
  const numericAqi = result?.aqi ?? null;
  const level = numericAqi != null ? getAQILevel(numericAqi) : getAQILevelFromEpa(epa);
  const primary = getPrimaryPollutant(airQuality);
  const pollutants = getSortedPollutants(airQuality);
  const summary = getAQISummary(airQuality);

  const animAqi = useAnimatedNumber(numericAqi ?? 0);

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
    <div className="aqi-overlay" onClick={onClose}>
      <div
        className="aqi-detail"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Air Quality Details"
      >
        {/* Header */}
        <div className="aqi-detail-header">
          <span className="aqi-detail-title">Air Quality</span>
          <button className="aqi-detail-close" onClick={onClose} aria-label="Close air quality details">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Hero */}
        <div className="aqi-hero">
          {numericAqi != null ? (
            <>
              <div className="aqi-hero-index" style={{ color: level.color }}>{animAqi}</div>
              <span className="aqi-hero-index-label">US AQI</span>
            </>
          ) : (
            <>
              <div className="aqi-hero-index" style={{ color: level.color }}>{epa}</div>
              <span className="aqi-hero-index-label">US EPA Index</span>
            </>
          )}
          <span className={`aqi-hero-badge aqi-badge ${level.className}`}>{level.label}</span>
          <p className="aqi-hero-summary">{level.healthSummary}</p>
        </div>

        {/* Primary pollutant — only shown when at least one pollutant exceeds half its threshold */}
        {primary && primary.ratio > 0.5 && (
          <div className="aqi-card">
            <div className="aqi-card-header">
              <span className="aqi-section-title">Primary Pollutant</span>
              <span className={`aqi-pollutant-badge aqi-status-${getPollutantStatus(primary.value, primary.goodThreshold)}`}>
                {getPollutantStatus(primary.value, primary.goodThreshold)}
              </span>
            </div>
            <div className="aqi-primary-row">
              <div className="aqi-primary-stat">
                <span className="aqi-stat-value">{Math.round(primary.value * 10) / 10} {primary.unit}</span>
                <span className="aqi-stat-label">{primary.label}</span>
              </div>
              <div className="aqi-primary-stat">
                <span className="aqi-stat-value">{primary.fullName}</span>
                <span className="aqi-stat-label">Pollutant</span>
              </div>
            </div>
            <p className="aqi-primary-note">{primary.description}</p>
          </div>
        )}

        {/* Pollutant breakdown grid */}
        {pollutants.length > 0 && (
          <div className="aqi-card">
            <span className="aqi-section-title">Pollutant Breakdown</span>
            <div className="aqi-pollutant-grid">
              {pollutants.map((p) => {
                const status = getPollutantStatus(p.value, p.goodThreshold);
                return (
                  <div className="aqi-pollutant-item" key={p.key}>
                    <div className="aqi-pollutant-item-header">
                      <span className="aqi-pollutant-label">{p.label}</span>
                      <span className={`aqi-pollutant-dot aqi-dot-${status}`} />
                    </div>
                    <span className="aqi-pollutant-value">{Math.round(p.value * 10) / 10}</span>
                    <span className="aqi-pollutant-unit">{p.unit}</span>
                    <span className="aqi-pollutant-name">{p.fullName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AQI scale ladder */}
        <div className="aqi-card">
          <span className="aqi-section-title">AQI Scale</span>
          <div className="aqi-ladder">
            {AQI_LEVELS.map((lvl) => {
              const activeAqi = numericAqi ?? ((epa || 1) - 1) * 50 + 25;
              const isActive = activeAqi >= lvl.rangeMin && activeAqi <= lvl.rangeMax;
              const isAbove = lvl.rangeMin > activeAqi;
              return (
                <div
                  className={`aqi-ladder-step${isActive ? ' active' : ''}${isAbove ? ' dimmed' : ''}`}
                  key={lvl.label}
                  style={isActive ? { borderLeftColor: lvl.color } : undefined}
                >
                  <div className="aqi-ladder-left">
                    <span className="aqi-ladder-index" style={isActive ? { color: lvl.color } : undefined}>{lvl.index}</span>
                    <span className="aqi-ladder-label">{lvl.label}</span>
                  </div>
                  <span className="aqi-ladder-range">{lvl.range}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outdoor activity guidance */}
        <div className="aqi-card">
          <span className="aqi-section-title">Outdoor Activity</span>
          <p className="aqi-guidance-text">{level.outdoorGuidance}</p>
          <div className="aqi-sensitive-box">
            <span className="aqi-sensitive-label">Sensitive Groups</span>
            <p className="aqi-sensitive-text">{level.sensitiveAdvice}</p>
          </div>
        </div>

        {/* At a glance */}
        <div className="aqi-card">
          <span className="aqi-section-title">At a Glance</span>
          <p className="aqi-summary-text">{summary}</p>
        </div>

        {/* Educational section */}
        <div className="aqi-card">
          <button className="aqi-edu-toggle" onClick={() => setEduOpen((o) => !o)}>
            Learn about air quality
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: eduOpen ? 'rotate(180deg)' : 'none' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {eduOpen && (
            <div className="aqi-edu-content">
              {EDU_BLOCKS.map((block) => (
                <div className="aqi-edu-block" key={block.title}>
                  <h5 className="aqi-edu-title">{block.title}</h5>
                  <p className="aqi-edu-body">{block.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
