import { forwardRef } from 'react';
import { getWeatherIcon } from '../utils/weatherIcon';

const MOOD_GRADIENTS = {
  clear: 'linear-gradient(165deg, #f59e0b 0%, #ef4444 40%, #8b5cf6 100%)',
  night: 'linear-gradient(165deg, #1e1b4b 0%, #4c1d95 40%, #0f172a 100%)',
  cloudy: 'linear-gradient(165deg, #475569 0%, #64748b 40%, #334155 100%)',
  rainy: 'linear-gradient(165deg, #0c4a6e 0%, #0891b2 40%, #1e3a5f 100%)',
  snowy: 'linear-gradient(165deg, #bae6fd 0%, #e0f2fe 40%, #93c5fd 100%)',
  stormy: 'linear-gradient(165deg, #581c87 0%, #7c3aed 40%, #4c1d95 100%)',
};

const MOOD_ACCENT = {
  clear: '#fbbf24',
  night: '#a78bfa',
  cloudy: '#94a3b8',
  rainy: '#38bdf8',
  snowy: '#0284c7',
  stormy: '#c084fc',
};

const font = "'Space Grotesk', 'Hanken Grotesk', system-ui, sans-serif";
const fontBody = "'Hanken Grotesk', system-ui, sans-serif";

function glass(opacity = 0.12) {
  return {
    background: `rgba(255, 255, 255, ${opacity})`,
    borderRadius: 16,
    border: '1px solid rgba(255, 255, 255, 0.12)',
  };
}

const ShareCard = forwardRef(function ShareCard({ data, tempUnit, mood }, ref) {
  const { location, current, daily } = data;
  const isLight = mood === 'snowy';
  const color = isLight ? '#0f172a' : '#ffffff';
  const muted = isLight ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.5)';
  const subtle = isLight ? 'rgba(15, 23, 42, 0.3)' : 'rgba(255, 255, 255, 0.3)';
  const accent = MOOD_ACCENT[mood] || MOOD_ACCENT.clear;
  const bg = MOOD_GRADIENTS[mood] || MOOD_GRADIENTS.clear;

  const temp = Math.round(current.temp[tempUnit]);
  const feelsLike = Math.round(current.feels_like[tempUnit]);
  const unit = `°${tempUnit.toUpperCase()}`;
  // Prefer the vendor's raster icon (proven in html2canvas); fall back to the
  // bundled Meteocon when the provider supplies none (e.g. Open-Meteo).
  const iconUrl = current.condition.icon_url || getWeatherIcon(current.condition.id, current.is_day);

  const date = new Date(location.localtime);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const days = daily?.slice(0, 3) || [];

  const detailPills = [
    { label: 'Feels like', value: `${feelsLike}${unit}` },
    { label: 'Wind', value: `${Math.round(current.wind.speed_kph)} km/h` },
    { label: 'Humidity', value: `${current.humidity}%` },
  ];

  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
      <div
        ref={ref}
        style={{
          width: 540,
          height: 960,
          background: bg,
          borderRadius: 32,
          padding: '0',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: font,
          color,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative orb top-right */}
        <div style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
        }} />

        {/* Decorative orb bottom-left */}
        <div style={{
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        }} />

        {/* Top bar — branding + time */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '36px 36px 0',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <svg width="20" height="16" viewBox="2 4 20 15" fill={color}>
              <circle cx="10.2" cy="9.8" r="4.8" />
              <circle cx="15.2" cy="10.8" r="3.6" />
              <circle cx="6.6" cy="12.8" r="3.6" />
              <circle cx="18.2" cy="13.6" r="3.1" />
              <rect x="6.2" y="11.2" width="12.4" height="5.6" rx="2.8" />
            </svg>
            <span style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Nimbus
            </span>
          </div>
          <span style={{
            fontSize: 13,
            fontFamily: fontBody,
            color: muted,
            fontWeight: 500,
          }}>
            {formattedTime}
          </span>
        </div>

        {/* Location */}
        <div style={{ padding: '40px 36px 0', textAlign: 'center' }}>
          <div style={{
            fontSize: 32,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            {location.name}
          </div>
          <div style={{
            fontSize: 14,
            fontFamily: fontBody,
            color: muted,
            marginTop: 6,
            fontWeight: 400,
          }}>
            {[location.region, location.country].filter(Boolean).join(', ')}
          </div>
          <div style={{
            fontSize: 13,
            fontFamily: fontBody,
            color: subtle,
            marginTop: 4,
            fontWeight: 400,
          }}>
            {formattedDate}
          </div>
        </div>

        {/* Hero temperature */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '36px 36px 0',
        }}>
          <div style={{
            fontSize: 140,
            fontWeight: 200,
            lineHeight: 1,
            letterSpacing: '-0.06em',
            position: 'relative',
          }}>
            {temp}
            <span style={{
              fontSize: 48,
              fontWeight: 300,
              position: 'absolute',
              top: 12,
              marginLeft: 2,
            }}>
              °
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 8,
          }}>
            <img
              src={iconUrl}
              alt=""
              style={{ width: 44, height: 44 }}
              crossOrigin="anonymous"
            />
            <span style={{
              fontSize: 20,
              fontWeight: 500,
              fontFamily: fontBody,
            }}>
              {current.condition.text}
            </span>
          </div>
        </div>

        {/* Detail pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          padding: '32px 36px 0',
        }}>
          {detailPills.map((pill) => (
            <div
              key={pill.label}
              style={{
                ...glass(isLight ? 0.2 : 0.1),
                padding: '14px 20px',
                textAlign: 'center',
                flex: 1,
              }}
            >
              <div style={{
                fontSize: 11,
                fontFamily: fontBody,
                color: muted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 500,
                marginBottom: 6,
              }}>
                {pill.label}
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: 600,
              }}>
                {pill.value}
              </div>
            </div>
          ))}
        </div>

        {/* 3-day forecast */}
        {days.length > 0 && (
          <div style={{
            margin: '28px 36px 0',
            ...glass(isLight ? 0.2 : 0.1),
            padding: '20px 24px',
          }}>
            <div style={{
              fontSize: 11,
              fontFamily: fontBody,
              color: muted,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
              marginBottom: 16,
            }}>
              Forecast
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {days.map((day, i) => {
                const d = new Date(day.date + 'T00:00:00');
                const dayName = i === 0
                  ? 'Today'
                  : d.toLocaleDateString('en-US', { weekday: 'short' });
                const hi = Math.round(day.high[tempUnit]);
                const lo = Math.round(day.low[tempUnit]);
                const dayIconUrl = day.condition.icon_url || getWeatherIcon(day.condition.id, 1);

                return (
                  <div key={day.date} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{
                      fontSize: 15,
                      fontWeight: 500,
                      fontFamily: fontBody,
                      width: 60,
                    }}>
                      {dayName}
                    </span>
                    <img
                      src={dayIconUrl}
                      alt=""
                      style={{ width: 32, height: 32 }}
                      crossOrigin="anonymous"
                    />
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontFamily: fontBody,
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>
                        {hi}°
                      </span>
                      <span style={{ fontSize: 15, color: muted }}>
                        {lo}°
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer — app link */}
        <div style={{
          padding: '0 36px 36px',
          textAlign: 'center',
        }}>
          <div style={{
            ...glass(isLight ? 0.18 : 0.08),
            padding: '14px 24px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 100,
          }}>
            <svg width="15" height="12" viewBox="2 4 20 15" fill={muted}>
              <circle cx="10.2" cy="9.8" r="4.8" />
              <circle cx="15.2" cy="10.8" r="3.6" />
              <circle cx="6.6" cy="12.8" r="3.6" />
              <circle cx="18.2" cy="13.6" r="3.1" />
              <rect x="6.2" y="11.2" width="12.4" height="5.6" rx="2.8" />
            </svg>
            <span style={{
              fontSize: 13,
              fontFamily: fontBody,
              color: muted,
              fontWeight: 500,
              letterSpacing: '0.01em',
            }}>
              nimbus-weather-2026.netlify.app
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ShareCard;
