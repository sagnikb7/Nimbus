import { useMemo } from 'react';
import { getHourlyPrecip, getPrecipType, fmtMm } from '../utils/precipUtils';
import { smoothLine, hourLabel } from '../utils/chart';

// Dual-encoded hourly precip: a probability CURVE (chance of rain, %) on top and
// AMOUNT bars (mm) below — "how likely" and "how much" at a glance. Modeled on
// the HourlyForecast/WindHourlyGraph geometry (fixed px, Catmull-Rom curve, Now
// marker, night bands). Colors are fixed water-blues per app convention.
const COL = 56;      // width per hour column
const H_TIME = 20;   // time-label row
const H_LINE = 56;   // probability-curve band
const H_BARS = 36;   // amount-bar row
const PAD = 10;      // top padding inside the curve band (room for % labels)
const MM_FLOOR = 1;  // bars scale against at least this many mm (drizzle stays low)
const CHANCE_LABEL_MIN = 20; // show the % only when worth reading

export default function PrecipHourlyGraph({ forecastDays, localtime }) {
  const model = useMemo(() => {
    const hours = getHourlyPrecip(forecastDays, localtime);
    if (hours.length < 2) return null;

    const maxMm = Math.max(MM_FLOOR, ...hours.map((h) => h.precip_mm));
    const chanceY = (c) => PAD + (H_LINE - PAD) * (1 - c / 100);

    const cols = hours.map((h, i) => {
      const date = new Date(h.time);
      const isSnow = getPrecipType(h.conditionId) === 'snow';
      return {
        key: h.time_epoch ?? i,
        isNow: i === 0,
        label: hourLabel(date, i === 0),
        chance: Math.round(h.chance),
        mm: h.precip_mm,
        snow_cm: h.snow_cm,
        isSnow,
        isNight: h.is_day === 0,
        x: i * COL + COL / 2,
        y: chanceY(h.chance),
        barH: Math.max(h.precip_mm > 0 ? 3 : 0, (h.precip_mm / maxMm) * (H_BARS - 10)),
      };
    });

    const width = hours.length * COL;
    const line = smoothLine(cols);
    const first = cols[0];
    const last = cols[cols.length - 1];
    const area = `${line} L ${last.x} ${H_LINE} L ${first.x} ${H_LINE} Z`;
    const anyPrecip = hours.some((h) => h.precip_mm > 0 || h.chance >= 20);
    const maxChance = Math.max(...cols.map((c) => c.chance));

    return { cols, width, line, area, anyPrecip, maxChance };
  }, [forecastDays, localtime]);

  if (!model) return null;
  const { cols, width, line, area, anyPrecip, maxChance } = model;

  if (!anyPrecip) {
    return (
      <div className="precip-card">
        <span className="precip-section-title">Next 24 Hours</span>
        <p className="precip-empty">No precipitation expected in the next 24 hours. ☀️</p>
      </div>
    );
  }

  const graphTop = H_TIME;

  return (
    <div className="precip-card">
      <div className="precip-card-header">
        <span className="precip-section-title">Next 24 Hours</span>
        <span className="precip-graph-peak">peak chance {maxChance}%</span>
      </div>

      <div className="precip-graph-scroll">
        <div className="precip-graph-track" style={{ width, height: H_TIME + H_LINE + H_BARS }}>
          <svg
            className="precip-graph-svg"
            style={{ top: graphTop, width, height: H_LINE }}
            viewBox={`0 0 ${width} ${H_LINE}`}
            width={width}
            height={H_LINE}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="precipArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.24" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {cols.map((c) =>
              c.isNight ? (
                <rect key={`n${c.key}`} className="precip-graph-night" x={c.x - COL / 2} y="0" width={COL} height={H_LINE} />
              ) : null
            )}
            <path className="precip-graph-area" d={area} fill="url(#precipArea)" />
            <path className="precip-graph-line" d={line} fill="none" />
            <line className="precip-graph-now-line" x1={cols[0].x} y1="0" x2={cols[0].x} y2={H_LINE} />
            <circle className="precip-graph-now-dot" cx={cols[0].x} cy={cols[0].y} r="3.5" />
          </svg>

          <div className="precip-graph-cols">
            {cols.map((c) => (
              <div
                key={c.key}
                className={`precip-graph-col${c.isNow ? ' is-now' : ''}`}
                style={{ width: COL }}
                role="listitem"
                aria-label={`${c.label}, ${c.chance}% chance, ${fmtMm(c.mm)} mm${c.snow_cm > 0 ? `, ${fmtMm(c.snow_cm)} cm snow` : ''}`}
              >
                <span className="precip-graph-time" style={{ height: H_TIME }}>{c.label}</span>
                <span className="precip-graph-cell" style={{ height: H_LINE }}>
                  {c.chance >= CHANCE_LABEL_MIN && (
                    <span className="precip-graph-pct" style={{ top: c.y }}>{c.chance}%</span>
                  )}
                </span>
                <span className="precip-graph-bar-cell" style={{ height: H_BARS }}>
                  {c.barH > 0 && (
                    <span
                      className={`precip-graph-bar${c.isSnow ? ' snow' : ''}`}
                      style={{ height: c.barH }}
                    />
                  )}
                </span>

                <span className="precip-graph-tip" role="tooltip">
                  <strong>{c.chance}%</strong> chance · {fmtMm(c.mm)} mm
                  {c.snow_cm > 0 && <> · {fmtMm(c.snow_cm)} cm snow</>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="precip-graph-legend">
        <span className="precip-graph-legend-item"><span className="precip-graph-swatch line" /> Chance (%)</span>
        <span className="precip-graph-legend-item"><span className="precip-graph-swatch bar" /> Amount (mm)</span>
      </div>
    </div>
  );
}
