import { useState } from 'react';
import useAnimatedNumber from '../hooks/useAnimatedNumber';
import useOverlayDismiss from '../hooks/useOverlayDismiss';
import CloseButton from './CloseButton';
import WindHourlyGraph from './WindHourlyGraph';
import { formatHour } from '../utils/chart';
import {
  WIND_CATEGORIES,
  getWindCategory,
  getHourlyWind,
  getPrevailingDirection,
  getGustAssessment,
  getPeakWindHour,
  getWindSummary,
} from '../utils/windUtils';

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

export default function WindDetail({ current, forecastDays, localtime, tempUnit = 'c', onClose }) {
  const [eduOpen, setEduOpen] = useState(false);

  // Wind chill: only surface when wind makes it feel COLDER (feels_like below
  // actual) — that drop is wind's doing. Warmer "feels like" (heat index) isn't,
  // so it's not shown on the wind page. Threshold checked in °C, shown in unit.
  const windChill = current.temp.c - current.feels_like.c >= 2;
  const feelsLike = Math.round(current.feels_like[tempUnit]);

  const category = getWindCategory(current.wind.speed_kph);
  const hourlyWind = getHourlyWind(forecastDays, localtime);
  const summary = getWindSummary(current, forecastDays, localtime);
  const gustInfo = getGustAssessment(current.wind.speed_kph, current.wind.gust_kph);
  const peakHour = getPeakWindHour(forecastDays);
  const prevailingDir = getPrevailingDirection(forecastDays);
  const todayMax = forecastDays?.[0]?.max_wind_kph;
  const gustDelta = Math.round((current.wind.gust_kph || 0) - (current.wind.speed_kph || 0));

  const animSpeed = useAnimatedNumber(Math.round(current.wind.speed_kph));
  const animGust = useAnimatedNumber(Math.round(current.wind.gust_kph || 0));

  useOverlayDismiss(onClose);

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
          <CloseButton className="wind-detail-close" onClick={onClose} label="Close wind details" />
        </div>

        {/* Hero */}
        <div className="wind-hero">
          <div className="wind-hero-main">
            <span className="wind-hero-speed">{animSpeed}</span>
            <span className="wind-hero-unit">km/h</span>
          </div>
          <div className="wind-hero-meta">
            <span className="wind-hero-dir-badge">{current.wind.dir}</span>
            <span className="wind-hero-deg">{current.wind.degree}&deg;</span>
          </div>
          <span className="wind-hero-category">{category.label}</span>
          {windChill && (
            <span className="wind-hero-feels">Wind chill — feels like {feelsLike}&deg;</span>
          )}
        </div>

        {/* At a glance — plain-language takeaway, right under the hero */}
        <div className="wind-card">
          <span className="wind-section-title">At a Glance</span>
          <p className="wind-summary-text">{summary}</p>
        </div>

        {/* Hourly wind graph — what's coming next */}
        <WindHourlyGraph hours={hourlyWind} />

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

        {/* Category ladder — reference */}
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
