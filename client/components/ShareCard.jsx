import { forwardRef } from 'react';

const MOOD_GRADIENTS = {
  clear: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%)',
  night: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #0f172a 100%)',
  cloudy: 'linear-gradient(135deg, #475569 0%, #64748b 50%, #334155 100%)',
  rainy: 'linear-gradient(135deg, #0369a1 0%, #0891b2 50%, #1e3a5f 100%)',
  snowy: 'linear-gradient(135deg, #bae6fd 0%, #e0f2fe 50%, #7dd3fc 100%)',
  stormy: 'linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #4c1d95 100%)',
};

const ShareCard = forwardRef(function ShareCard({ data, tempUnit, mood }, ref) {
  const { location, current } = data;
  const temp = Math.round(current[tempUnit === 'c' ? 'temp_c' : 'temp_f']);
  const icon = current.condition.icon;
  const iconUrl = icon.startsWith('//') ? `https:${icon}` : icon;
  const bg = MOOD_GRADIENTS[mood] || MOOD_GRADIENTS.clear;
  const isLight = mood === 'snowy';

  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      <div
        ref={ref}
        style={{
          width: 600,
          height: 400,
          background: bg,
          borderRadius: 24,
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
          color: isLight ? '#1e293b' : '#ffffff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 24,
          left: 28,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          opacity: 0.6,
        }}>
          Nimbus
        </div>

        <div style={{
          fontSize: 96,
          fontWeight: 300,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          marginBottom: 8,
        }}>
          {temp}&deg;
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}>
          <img
            src={iconUrl}
            alt=""
            style={{ width: 40, height: 40 }}
            crossOrigin="anonymous"
          />
          <span style={{ fontSize: 20, fontWeight: 500 }}>
            {current.condition.text}
          </span>
        </div>

        <div style={{
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}>
          {location.name}
        </div>
        <div style={{
          fontSize: 13,
          opacity: 0.6,
          marginTop: 4,
        }}>
          {[location.region, location.country].filter(Boolean).join(', ')}
        </div>

        <div style={{
          position: 'absolute',
          bottom: 20,
          fontSize: 10,
          opacity: 0.4,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          nimbus weather
        </div>
      </div>
    </div>
  );
});

export default ShareCard;
