import { useState } from 'react';
import useOverlayDismiss from '../hooks/useOverlayDismiss';
import CloseButton from './CloseButton';
import PrecipHourlyGraph from './PrecipHourlyGraph';
import { getWeatherIcon } from '../utils/weatherIcon';
import {
  PRECIP_INTENSITY_LEVELS,
  getPrecipIntensity,
  getPrecipType,
  precipTypeLabel,
  getHourlyPrecip,
  getTodayPrecipTotal,
  getPeakPrecipHour,
  getPrecipSummary,
  fmtMm,
} from '../utils/precipUtils';
import { formatHour } from '../utils/chart';

const EDU_BLOCKS = [
  {
    title: 'What "chance of rain" means',
    body: 'It’s the probability that measurable precipitation (at least 0.1 mm) falls at a given spot during that hour. 60% means 6 in 10 chance it rains where you are — not that it rains 60% of the time.',
  },
  {
    title: 'Millimetres, explained',
    body: '1 mm of rain = 1 litre of water spread over a square metre. Amounts tell you how heavy it is; chance tells you how likely. A high chance with tiny amounts is just a passing sprinkle.',
  },
  {
    title: 'How heavy is heavy?',
    body: 'Light rain is under 2.5 mm/h (a drizzle). Moderate is 2.5–7.6 mm/h (steady). Heavy is 7.6–50 mm/h (a real downpour). Above 50 mm/h is violent — flooding territory.',
  },
  {
    title: 'Rain vs snow',
    body: 'Snow is fluffy — roughly 1 cm of snow melts down to only about 1 mm of water. So a modest water amount can still mean a lot of snow on the ground.',
  },
  {
    title: 'Why it matters',
    body: 'Precipitation drives your plans: umbrella or not, driving safety, flooding risk, and how cold a day feels. Checking amount and chance together beats a single icon.',
  },
];

export default function PrecipDetail({ current, forecastDays, localtime, onClose }) {
  const [eduOpen, setEduOpen] = useState(false);
  useOverlayDismiss(onClose);

  const nowMm = Number(current.precip_mm) || 0;
  const type = getPrecipType(current.condition?.id);
  const raining = nowMm >= 0.1 || type !== 'none';
  const level = getPrecipIntensity(nowMm);

  const hours = getHourlyPrecip(forecastDays, localtime);
  const nowChance = hours[0]?.chance ?? forecastDays?.[0]?.chance_of_rain ?? 0;
  const { mm: todayMm, snow_cm: todaySnow } = getTodayPrecipTotal(forecastDays);
  const peak = getPeakPrecipHour(hours);
  const maxChance = hours.length ? Math.max(...hours.map((h) => h.chance)) : (forecastDays?.[0]?.chance_of_rain ?? 0);
  const summary = getPrecipSummary(current, forecastDays, localtime);

  const days = forecastDays || [];
  const maxDayChance = Math.max(1, ...days.map((d) => d.chance_of_rain ?? 0));

  return (
    <div className="precip-overlay" onClick={onClose}>
      <div
        className="precip-detail"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Precipitation Details"
      >
        {/* Header */}
        <div className="precip-detail-header">
          <span className="precip-detail-title">Precipitation</span>
          <CloseButton className="precip-detail-close" onClick={onClose} label="Close precipitation details" />
        </div>

        {/* Hero — current state */}
        <div className={`precip-hero${raining ? '' : ' is-dry'}`}>
          {raining ? (
            <>
              <div className="precip-hero-main">
                <span className="precip-hero-value">{fmtMm(nowMm)}</span>
                <span className="precip-hero-unit">mm/h</span>
              </div>
              <span className="precip-hero-badge">{precipTypeLabel(type)} · {level.label}</span>
            </>
          ) : (
            <>
              <div className="precip-hero-dry-word">Dry</div>
              <span className="precip-hero-badge">No precipitation right now</span>
            </>
          )}
          <span className="precip-hero-meta">{nowChance}% chance this hour</span>
        </div>

        {/* At a glance */}
        <div className="precip-card">
          <span className="precip-section-title">At a Glance</span>
          <p className="precip-summary-text">{summary}</p>
        </div>

        {/* Hourly graph */}
        <PrecipHourlyGraph forecastDays={forecastDays} localtime={localtime} />

        {/* Today's summary */}
        <div className="precip-card">
          <span className="precip-section-title">Today&apos;s Summary</span>
          <div className="precip-stat-grid">
            <div className="precip-stat-item">
              <span className="precip-stat-value">{fmtMm(todayMm)}</span>
              <span className="precip-stat-label">Total (mm)</span>
            </div>
            <div className="precip-stat-item">
              <span className="precip-stat-value">{maxChance}%</span>
              <span className="precip-stat-label">Max Chance</span>
            </div>
            <div className="precip-stat-item">
              <span className="precip-stat-value">{peak && peak.precip_mm > 0 ? formatHour(peak.time) : '--'}</span>
              <span className="precip-stat-label">Wettest Hour</span>
            </div>
            {todaySnow > 0 ? (
              <div className="precip-stat-item">
                <span className="precip-stat-value">{fmtMm(todaySnow)}</span>
                <span className="precip-stat-label">Snow (cm)</span>
              </div>
            ) : (
              <div className="precip-stat-item">
                <span className="precip-stat-value">{current.humidity}%</span>
                <span className="precip-stat-label">Humidity</span>
              </div>
            )}
          </div>
        </div>

        {/* Multi-day outlook */}
        {days.length > 0 && (
          <div className="precip-card">
            <span className="precip-section-title">{days.length}-Day Outlook</span>
            <div className="precip-days">
              {days.map((d, i) => {
                const date = new Date(d.date + 'T00:00:00');
                const name = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                const chance = d.chance_of_rain ?? 0;
                const icon = d.condition.icon_url || getWeatherIcon(d.condition.id, 1);
                return (
                  <div className="precip-day-row" key={d.date}>
                    <span className="precip-day-name">{name}</span>
                    <img className="precip-day-icon" src={icon} alt="" />
                    <span className="precip-day-bar-track">
                      <span className="precip-day-bar" style={{ width: `${(chance / maxDayChance) * 100}%` }} />
                    </span>
                    <span className="precip-day-chance">{chance}%</span>
                    <span className="precip-day-extra">
                      {d.total_snow_cm > 0
                        ? `${fmtMm(d.total_snow_cm)} cm`
                        : (d.chance_of_snow ?? 0) > 0
                          ? `${d.chance_of_snow}% snow`
                          : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Intensity scale */}
        <div className="precip-card">
          <span className="precip-section-title">Rain Intensity</span>
          <div className="precip-ladder">
            {PRECIP_INTENSITY_LEVELS.filter((l) => l.key !== 'none').map((l) => {
              const isActive = raining && l.key === level.key;
              return (
                <div className={`precip-ladder-step${isActive ? ' active' : ''}`} key={l.key}>
                  <span className="precip-ladder-label">{l.label}</span>
                  <span className="precip-ladder-range">
                    {l.max === Infinity ? `${l.min}+` : `${l.min}–${l.max}`} mm/h
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Educational */}
        <div className="precip-card">
          <button className="precip-edu-toggle" onClick={() => setEduOpen((o) => !o)}>
            Learn about precipitation
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: eduOpen ? 'rotate(180deg)' : 'none' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {eduOpen && (
            <div className="precip-edu-content">
              {EDU_BLOCKS.map((block) => (
                <div className="precip-edu-block" key={block.title}>
                  <h5 className="precip-edu-title">{block.title}</h5>
                  <p className="precip-edu-body">{block.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
