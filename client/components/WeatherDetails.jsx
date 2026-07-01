import { calculateAQI, getAQILevel, getAQILevelFromEpa } from '../utils/aqiUtils';

// Accurate moon-phase glyph drawn from illumination (%) + waxing/waning.
// The lit region = a semicircle on the lit side joined to an elliptical
// terminator whose x-radius shrinks toward the quarter (straight line) and
// flips side between crescent (<50%) and gibbous (>50%).
function MoonPhaseIcon({ phase, illumination }) {
  const cx = 12, cy = 12, r = 8;
  const frac = Math.max(0, Math.min(1, (illumination ?? 50) / 100));
  const p = (phase || '').toLowerCase();
  const waxing = p.includes('waxing') || p.includes('first'); // lit on the right
  const outer = waxing ? 1 : 0;

  let lit = null;
  if (p.includes('full') || frac >= 0.98) {
    lit = <circle cx={cx} cy={cy} r={r} fill="currentColor" />;
  } else if (!(p.includes('new') || frac <= 0.02)) {
    const rx = Math.abs(r * (1 - 2 * frac));
    const inner = frac > 0.5 ? outer : 1 - outer;
    const d = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outer} ${cx} ${cy + r} A ${rx} ${r} 0 0 ${inner} ${cx} ${cy - r} Z`;
    lit = <path d={d} fill="currentColor" />;
  }

  return (
    <svg className="detail-pill-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
      {lit}
    </svg>
  );
}

export default function WeatherDetails({ current, onWindClick, onAQIClick }) {
  const aq = current.air_quality;
  const result = aq ? calculateAQI(aq) : null;
  const epa = aq?.epa_index;

  // Prefer calculated numeric AQI; fall back to EPA category index
  const numericAqi = result?.aqi;
  const aqiLevel = numericAqi != null
    ? getAQILevel(numericAqi)
    : epa != null ? getAQILevelFromEpa(epa) : null;
  const pillValue = numericAqi != null ? numericAqi : aqiLevel?.label;

  // AQI severity folded into the pill itself (no separate alert bar).
  const aqiConcerning = aqiLevel && ((numericAqi != null && numericAqi > 100) || (numericAqi == null && epa >= 3));
  const aqiSevere = aqiLevel && ((numericAqi != null && numericAqi > 200) || (numericAqi == null && epa >= 5));

  // Ordered by priority + light thematic grouping so the carousel reads intentionally:
  //   1) Interactive / health  → AQI, Wind (tap for detail)
  //   2) Comfort               → Humidity, UV
  //   3) Sky & precipitation   → Cloud, Precip
  //   4) Physical atmosphere   → Visibility, Pressure
  //   5) Celestial (exclusive) → Moon phase
  const details = [
    // 1) Interactive / health
    ...(aqiLevel
      ? [{
          label: 'AQI',
          value: pillValue,
          onClick: onAQIClick,
          alertColor: aqiConcerning ? aqiLevel.color : null,
          severe: aqiSevere,
        }]
      : []),
    { label: 'Wind', value: `${current.wind.speed_kph} km/h`, onClick: onWindClick },
    // 2) Comfort
    { label: 'Humidity', value: `${current.humidity}%` },
    { label: 'UV Index', value: current.uv },
    // 3) Sky & precipitation
    ...(current.cloud_cover != null ? [{ label: 'Cloud', value: `${current.cloud_cover}%` }] : []),
    { label: 'Precip', value: `${current.precip_mm} mm` },
    // 4) Physical atmosphere
    { label: 'Visibility', value: `${current.visibility_km} km` },
    { label: 'Pressure', value: `${current.pressure_mb} hPa` },
    // 5) Celestial — provider-exclusive (WeatherAPI). 2-liner: [glyph + illum%] / phase name.
    ...(current.moon_phase
      ? [{
          label: current.moon_phase,
          value: (
            <span className="detail-pill-moon">
              <MoonPhaseIcon phase={current.moon_phase} illumination={current.moon_illumination} />
              {current.moon_illumination != null ? `${current.moon_illumination}%` : ''}
            </span>
          ),
        }]
      : []),
  ];

  return (
    <div className="details-carousel">
      <div className="details-track">
        {details.map((d, i) => {
          const cls = [
            'detail-pill',
            d.onClick ? 'detail-pill--interactive' : '',
            d.alertColor ? 'detail-pill--alert' : '',
            d.alertColor && d.severe ? 'detail-pill--alert-severe' : '',
          ].filter(Boolean).join(' ');
          return (
            <div
              className={cls}
              key={d.label}
              style={{ animationDelay: `${i * 60}ms`, ...(d.alertColor ? { '--alert-color': d.alertColor } : null) }}
              onClick={d.onClick || undefined}
              role={d.onClick ? 'button' : undefined}
              tabIndex={d.onClick ? 0 : undefined}
              onKeyDown={d.onClick ? (e) => { if (e.key === 'Enter') d.onClick(); } : undefined}
            >
              <span className="detail-pill-value">{d.value}</span>
              <span className="detail-pill-label">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
