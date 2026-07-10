import { forwardRef } from 'react';
import { getWeatherIcon } from '../utils/weatherIcon';

// Poster palettes — always dark so white type stays crisp, with a soft mood
// "aurora" glow for the pop. Dark + radial glows render reliably in html2canvas
// (unlike backdrop-blur or gradient-clipped text, which don't). One palette per
// weather mood, plus a `night` variant used for clear nights.
const POSTER = {
  clear:  { base: ['#171019', '#241528'], glow: '#fbbf24', glow2: '#fb7185' },
  night:  { base: ['#0b0b1c', '#141230'], glow: '#a78bfa', glow2: '#6366f1' },
  cloudy: { base: ['#0f1319', '#191f27'], glow: '#a9b7c9', glow2: '#64748b' },
  rainy:  { base: ['#08131f', '#0c1e30'], glow: '#38bdf8', glow2: '#0ea5e9' },
  snowy:  { base: ['#0c1420', '#12202f'], glow: '#7dd3fc', glow2: '#bae6fd' },
  stormy: { base: ['#130a20', '#1c0f30'], glow: '#c084fc', glow2: '#a855f7' },
};

const font = "'Space Grotesk', 'Hanken Grotesk', system-ui, sans-serif";
const fontBody = "'Hanken Grotesk', system-ui, sans-serif";
// Brand hue — a single light violet standing in for the indigo→violet wordmark
// gradient (kept mood-independent, like the app logo).
const BRAND = '#c9baff';

const ShareCard = forwardRef(function ShareCard({ data, tempUnit, mood }, ref) {
  const { location, current } = data;
  // Night is a lighting modifier (mood is weather-only). Clear nights use the
  // dark 'night' palette; other moods keep their weather look after dark.
  const skyMood = mood === 'clear' && !current.is_day ? 'night' : mood;
  const p = POSTER[skyMood] || POSTER.clear;
  const { glow, glow2 } = p;

  const color = '#ffffff';
  const muted = 'rgba(255, 255, 255, 0.62)';
  const subtle = 'rgba(255, 255, 255, 0.4)';

  const temp = Math.round(current.temp[tempUnit]);
  // Prefer the vendor's raster icon (proven in html2canvas); fall back to the
  // bundled Meteocon when the provider supplies none (e.g. Open-Meteo).
  const iconUrl = current.condition.icon_url || getWeatherIcon(current.condition.id, current.is_day);
  const region = [location.region, location.country].filter(Boolean)[0] || '';
  const subline = [current.condition.text, region].filter(Boolean).join('  ·  ');

  const cloudGlyph = (fill, size) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden="true">
      <path d="M17.5 19H7a5 5 0 0 1-.78-9.94 6.5 6.5 0 0 1 12.28-1.4A4.75 4.75 0 0 1 17.5 19z" />
    </svg>
  );

  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      <div
        ref={ref}
        style={{
          width: 540,
          height: 960,
          background: `linear-gradient(163deg, ${p.base[0]} 0%, ${p.base[1]} 100%)`,
          borderRadius: 40,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: font,
          color,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Aurora — soft mood glows for depth (simple radials render reliably
            in html2canvas; the card gradient stays a plain linear). */}
        <div style={{
          position: 'absolute',
          top: -140,
          left: '50%',
          width: 620,
          height: 620,
          transform: 'translateX(-50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glow}40 0%, transparent 66%)`,
        }} />
        <div style={{
          position: 'absolute',
          bottom: -120,
          right: -120,
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glow2}33 0%, transparent 62%)`,
        }} />

        {/* Header — brand wordmark */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '52px 52px 0',
        }}>
          {cloudGlyph(BRAND, 22)}
          <span style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: BRAND,
          }}>
            Nimbus
          </span>
        </div>

        {/* Hero — the shareable weather moment */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 52px',
        }}>
          {/* Icon with a soft mood glow behind it */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 300,
              height: 300,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${glow}59 0%, transparent 68%)`,
            }} />
            <img
              src={iconUrl}
              alt=""
              style={{ width: 150, height: 150, position: 'relative' }}
              crossOrigin="anonymous"
            />
          </div>

          {/* Temperature */}
          <div style={{
            fontSize: 168,
            fontWeight: 200,
            lineHeight: 1,
            letterSpacing: '-0.06em',
            position: 'relative',
            marginTop: 8,
            textShadow: `0 0 70px ${glow}55`,
          }}>
            {temp}
            <span style={{
              fontSize: 56,
              fontWeight: 300,
              position: 'absolute',
              top: 16,
              marginLeft: 4,
              color: muted,
            }}>
              °
            </span>
          </div>

          {/* City */}
          <div style={{
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginTop: 20,
            textAlign: 'center',
          }}>
            {location.name}
          </div>

          {/* Condition · region */}
          <div style={{
            fontSize: 18,
            fontFamily: fontBody,
            color: muted,
            fontWeight: 500,
            marginTop: 10,
            textAlign: 'center',
          }}>
            {subline}
          </div>
        </div>

        {/* Footer — the ad / CTA */}
        <div style={{
          padding: '0 52px 56px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 27,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            marginBottom: 22,
          }}>
            Weather, beautifully.
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 9,
            background: glow,
            color: '#0c0c16',
            padding: '17px 30px',
            borderRadius: 100,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.01em',
            boxShadow: `0 10px 34px ${glow}55`,
          }}>
            Try Nimbus
            <span style={{ fontSize: 20, marginTop: -2 }}>→</span>
          </div>

          <div style={{
            fontSize: 13,
            fontFamily: fontBody,
            color: subtle,
            fontWeight: 500,
            letterSpacing: '0.02em',
            marginTop: 16,
          }}>
            nimbus-weather-2026.netlify.app
          </div>
        </div>
      </div>
    </div>
  );
});

export default ShareCard;
