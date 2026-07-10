import { useMemo } from 'react';
import { smoothLine, hourLabel } from '../utils/chart';

// A wind speed/gust graph modeled on HourlyForecast: an area+line for sustained
// wind with a lighter gust line above it, direction arrows along the baseline,
// a "Now" marker, and faint night bands. Fixed geometry (px) lives here so the
// SVG and the per-column labels/arrows stay pixel-aligned; CSS only does color.
const COL = 56;      // width per hour column
const H_TIME = 20;   // time-label row
const H_GRAPH = 74;  // speed/gust curve band
const H_ARROW = 30;  // direction-arrow row
const Y_TOP = 24;    // curve y for the strongest reading in view
const Y_BOT = 62;    // curve y for calm (0 km/h)
const SPEED_FLOOR = 12; // km/h that the scale never compresses below, so a calm
                        // day reads as a low, gentle line — not a fake full swing

export default function WindHourlyGraph({ hours }) {
  const model = useMemo(() => {
    const window = (hours || []).slice(0, 24);
    if (window.length < 2) return null;

    const speeds = window.map((h) => Math.round(h.wind.speed_kph));
    const gusts = window.map((h) => Math.round(h.wind.gust_kph || h.wind.speed_kph));
    // Absolute-ish scale (wind has a true zero): the strongest reading in view
    // sits at the top, 0 km/h at the baseline. Floored so a calm day stays low.
    const maxV = Math.max(SPEED_FLOOR, ...speeds, ...gusts);
    const scaleY = (v) => Y_BOT - (Y_BOT - Y_TOP) * (v / maxV);

    const cols = window.map((h, i) => {
      const date = new Date(h.time);
      return {
        key: h.time_epoch ?? i,
        isNow: i === 0,
        label: hourLabel(date, i === 0),
        speed: speeds[i],
        degree: h.wind.degree,
        dir: h.wind.dir,
        isNight: h.is_day === 0,
        x: i * COL + COL / 2,
        y: scaleY(speeds[i]),
        gy: scaleY(gusts[i]),
      };
    });

    const width = window.length * COL;
    const speedLine = smoothLine(cols);
    const gustLine = smoothLine(cols.map((c) => ({ x: c.x, y: c.gy })));
    const first = cols[0];
    const last = cols[cols.length - 1];
    const area = `${speedLine} L ${last.x} ${H_GRAPH} L ${first.x} ${H_GRAPH} Z`;

    // Trend chip: compare the average of the back third vs the front third.
    const third = Math.max(1, Math.floor(cols.length / 3));
    const avg = (arr) => arr.reduce((s, c) => s + c.speed, 0) / arr.length;
    const delta = avg(cols.slice(-third)) - avg(cols.slice(0, third));
    const trend = delta > 4 ? { arrow: '↑', word: 'Building' }
      : delta < -4 ? { arrow: '↓', word: 'Easing' }
      : { arrow: '→', word: 'Steady' };
    const peakGust = Math.max(...gusts);

    return { cols, width, speedLine, gustLine, area, trend, peakGust };
  }, [hours]);

  if (!model) return null;
  const { cols, width, speedLine, gustLine, area, trend, peakGust } = model;

  return (
    <div className="wind-card">
      <div className="wind-card-header">
        <span className="wind-section-title">Hourly Wind</span>
        <span className="wind-graph-trend">
          {trend.arrow} {trend.word} · peak {peakGust} km/h
        </span>
      </div>

      <div className="wind-graph-scroll">
        <div className="wind-graph-track" style={{ width, height: H_TIME + H_GRAPH + H_ARROW }}>
          <svg
            className="wind-graph-svg"
            style={{ top: H_TIME, width, height: H_GRAPH }}
            viewBox={`0 0 ${width} ${H_GRAPH}`}
            width={width}
            height={H_GRAPH}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="windArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.26" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {cols.map((c) =>
              c.isNight ? (
                <rect key={`n${c.key}`} className="wind-graph-night" x={c.x - COL / 2} y="0" width={COL} height={H_GRAPH} />
              ) : null
            )}
            <path className="wind-graph-area" d={area} fill="url(#windArea)" />
            <path className="wind-graph-gust" d={gustLine} fill="none" />
            <path className="wind-graph-line" d={speedLine} fill="none" />
            <line className="wind-graph-now-line" x1={cols[0].x} y1="0" x2={cols[0].x} y2={H_GRAPH} />
            <circle className="wind-graph-now-dot" cx={cols[0].x} cy={cols[0].y} r="3.5" />
          </svg>

          <div className="wind-graph-cols">
            {cols.map((c) => (
              <div
                key={c.key}
                className={`wind-graph-col${c.isNow ? ' is-now' : ''}`}
                style={{ width: COL }}
                role="listitem"
                aria-label={`${c.label}, ${c.speed} km/h from ${c.dir}`}
              >
                <span className="wind-graph-time" style={{ height: H_TIME }}>{c.label}</span>
                <span className="wind-graph-cell" style={{ height: H_GRAPH }}>
                  <span className="wind-graph-value" style={{ top: c.y }}>{c.speed}</span>
                </span>
                <span className="wind-graph-arrow-cell" style={{ height: H_ARROW }}>
                  <svg className="wind-graph-arrow" viewBox="0 0 24 24" style={{ transform: `rotate(${c.degree}deg)` }}>
                    <line x1="12" y1="5" x2="12" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <polygon points="12,3 8,11 16,11" fill="currentColor" />
                  </svg>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wind-graph-legend">
        <span className="wind-graph-legend-item"><span className="wind-graph-swatch wind" /> Wind</span>
        <span className="wind-graph-legend-item"><span className="wind-graph-swatch gust" /> Gust</span>
        <span className="wind-graph-legend-item">↑ direction from</span>
      </div>
    </div>
  );
}
