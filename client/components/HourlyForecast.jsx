import { useMemo } from 'react';
import { getWeatherIcon } from '../utils/weatherIcon';
import { smoothLine, hourLabel } from '../utils/chart';

// Fixed layout geometry (px). JS owns it so the SVG curve and the per-column
// labels/values/bars stay pixel-aligned; CSS only handles color & type.
const COL = 58;      // width per hour column
const H_TIME = 20;   // time-label row
const H_ICON = 34;   // icon row
const H_GRAPH = 66;  // temperature-curve band
const H_RAIN = 30;   // precipitation-bar row
const Y_TOP = 22;    // curve y for the hottest hour (leaves room for value labels)
const Y_BOT = 58;    // curve y for the coldest hour
const DAMP_RANGE = 12; // °span that maps to full curve amplitude (smaller = gentler)
const RAIN_LABEL_MIN = 30; // show the % only when it's worth reading

export default function HourlyForecast({ forecastDays, localtime, tempUnit }) {
  const model = useMemo(() => {
    const now = new Date(localtime);

    // Window: current hour → +24h (same as before), capped at 24 points.
    const hours = [];
    for (const day of forecastDays) {
      for (const hour of day.hour) {
        const diffH = (new Date(hour.time) - now) / 3.6e6;
        if (diffH >= -0.5 && diffH <= 24) hours.push(hour);
      }
    }
    const window = hours.slice(0, 24);
    if (window.length === 0) return null;

    // Temperatures in the displayed unit drive both the curve and the labels.
    const temps = window.map((h) => Math.round(h.temp[tempUnit]));
    const lo = Math.min(...temps);
    const hi = Math.max(...temps);
    const range = hi - lo;
    // Hottest hour sits near the top; cooler hours drop below, with the area
    // filling underneath. Small ranges are damped so a near-flat day reads as a
    // gentle line high in the band (area gives it body) — never a big fake swing
    // for a 2° change, and never pinned to the bottom edge.
    const span = range || 1;
    const damp = Math.min(1, range / DAMP_RANGE);
    const scaleY = (t) => Y_TOP + (Y_BOT - Y_TOP) * ((hi - t) / span) * damp;

    const cols = window.map((h, i) => {
      const date = new Date(h.time);
      const chance = Math.round(h.chance_of_rain ?? 0);
      return {
        key: h.time_epoch ?? i,
        isNow: i === 0,
        label: hourLabel(date, i === 0),
        icon: getWeatherIcon(h.condition.id, h.is_day),
        conditionText: h.condition.text,
        temp: temps[i],
        chance,
        isNight: h.is_day === 0,
        wind: h.wind,
        x: i * COL + COL / 2,
        y: scaleY(temps[i]),
      };
    });

    const width = window.length * COL;
    const line = smoothLine(cols);
    const first = cols[0];
    const last = cols[cols.length - 1];
    const area = `${line} L ${last.x} ${H_GRAPH} L ${first.x} ${H_GRAPH} Z`;

    const hasRain = window.some((h) => (h.chance_of_rain ?? 0) > 0);

    // Micro-summary: trend + a rain heads-up, from the data we already have.
    // Trend = the biggest swing from "now" across the window (so an overnight
    // drop reads as "Cooling" even if temps recover a day later).
    let peak = 0;
    for (const c of cols) {
      if (Math.abs(c.temp - first.temp) > Math.abs(peak)) peak = c.temp - first.temp;
    }
    const trend =
      peak >= 2 ? { arrow: '↑', word: 'Warming' } : peak <= -2 ? { arrow: '↓', word: 'Cooling' } : { arrow: '→', word: 'Steady' };
    const rainHour = cols.find((c) => !c.isNow && c.chance >= 40);
    const maxChance = Math.max(...cols.map((c) => c.chance));
    let rainNote = '';
    if (rainHour) rainNote = `Rain by ${rainHour.label}`;
    else if (maxChance >= 30) rainNote = 'Showers possible';

    return { cols, width, line, area, hasRain, trend, rainNote };
  }, [forecastDays, localtime, tempUnit]);

  if (!model) return null;
  const { cols, width, line, area, hasRain, trend, rainNote } = model;

  const graphTop = H_TIME + H_ICON;

  return (
    <div className="hourly">
      <div className="hourly-head">
        <h3 className="hourly-title">Hourly</h3>
        <span className="hourly-summary">
          <span className="hourly-summary-trend">{trend.arrow} {trend.word}</span>
          {rainNote && <span className="hourly-summary-rain"> · {rainNote}</span>}
        </span>
      </div>

      <div className="hourly-scroll">
        <div className="hourly-track" style={{ width, height: graphTop + H_GRAPH + (hasRain ? H_RAIN : 0) }}>
          {/* Temperature curve — decorative; values are conveyed by the labels below */}
          <svg
            className="hourly-graph-svg"
            style={{ top: graphTop, width, height: H_GRAPH }}
            viewBox={`0 0 ${width} ${H_GRAPH}`}
            width={width}
            height={H_GRAPH}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hourlyArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Faint bands behind night hours */}
            {cols.map((c) =>
              c.isNight ? (
                <rect key={`n${c.key}`} className="hourly-night" x={c.x - COL / 2} y="0" width={COL} height={H_GRAPH} />
              ) : null
            )}
            <path className="hourly-area" d={area} fill="url(#hourlyArea)" />
            <path className="hourly-line" d={line} fill="none" pathLength="1" />
            {/* Now marker */}
            <line className="hourly-now-line" x1={cols[0].x} y1="0" x2={cols[0].x} y2={H_GRAPH} />
            <circle className="hourly-now-dot" cx={cols[0].x} cy={cols[0].y} r="3.5" />
          </svg>

          <div className="hourly-cols">
            {cols.map((c) => (
              <div
                key={c.key}
                className={`hourly-col${c.isNow ? ' is-now' : ''}`}
                style={{ width: COL }}
                tabIndex={0}
                role="listitem"
                aria-label={`${c.label}, ${c.temp}°, ${c.conditionText}${c.chance > 0 ? `, ${c.chance}% rain` : ''}`}
              >
                <span className="hourly-time" style={{ height: H_TIME }}>{c.label}</span>
                <span className="hourly-icon-wrap" style={{ height: H_ICON }}>
                  <img className="hourly-icon" src={c.icon} alt="" />
                </span>
                <span className="hourly-graph-cell" style={{ height: H_GRAPH }}>
                  <span className="hourly-temp" style={{ top: c.y }}>{c.temp}°</span>
                </span>
                {hasRain && (
                  <span className="hourly-rain-cell" style={{ height: H_RAIN }}>
                    {c.chance >= RAIN_LABEL_MIN && <span className="hourly-rain-pct">{c.chance}%</span>}
                    <span
                      className={`hourly-rain-bar${c.chance > 0 ? ' has-rain' : ''}`}
                      style={{ height: c.chance > 0 ? Math.max(3, (c.chance / 100) * (H_RAIN - 12)) : 2 }}
                    />
                  </span>
                )}

                {/* Hover/focus detail */}
                <span className="hourly-tip" role="tooltip">
                  <strong>{c.temp}°</strong> · {c.conditionText}
                  {c.chance > 0 && <> · {c.chance}% rain</>}
                  <br />
                  {Math.round(c.wind.speed_kph)} km/h {c.wind.dir}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
