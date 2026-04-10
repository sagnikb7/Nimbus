import { useMemo } from 'react';

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function generateParticles(mood) {
  if (!mood) return null;

  switch (mood) {
    case 'clear':
      return Array.from({ length: 12 }, (_, i) => ({
        type: 'orb',
        key: i,
        style: {
          left: `${rand(5, 95)}%`,
          width: `${rand(3, 8)}px`,
          height: `${rand(3, 8)}px`,
          animationDuration: `${rand(15, 25)}s`,
          animationDelay: `${rand(0, 15)}s`,
          opacity: rand(0.08, 0.25),
        },
      }));

    case 'night':
      return Array.from({ length: 35 }, (_, i) => ({
        type: 'star',
        key: i,
        style: {
          left: `${rand(2, 98)}%`,
          top: `${rand(2, 70)}%`,
          width: `${rand(1, 3)}px`,
          height: `${rand(1, 3)}px`,
          animationDuration: `${rand(3, 6)}s`,
          animationDelay: `${rand(0, 5)}s`,
        },
      }));

    case 'cloudy':
      return Array.from({ length: 4 }, (_, i) => ({
        type: 'cloud',
        key: i,
        style: {
          top: `${rand(5, 50)}%`,
          animationDuration: `${rand(50, 70)}s`,
          animationDelay: `${rand(0, 30)}s`,
          opacity: rand(0.02, 0.05),
          transform: `scale(${rand(0.8, 1.4)})`,
        },
      }));

    case 'rainy':
      return Array.from({ length: 40 }, (_, i) => ({
        type: 'raindrop',
        key: i,
        style: {
          left: `${rand(0, 100)}%`,
          height: `${rand(20, 40)}px`,
          animationDuration: `${rand(0.5, 1.2)}s`,
          animationDelay: `${rand(0, 2)}s`,
          opacity: rand(0.1, 0.3),
        },
      }));

    case 'snowy':
      return Array.from({ length: 25 }, (_, i) => ({
        type: 'snowflake',
        key: i,
        style: {
          left: `${rand(0, 100)}%`,
          width: `${rand(2, 5)}px`,
          height: `${rand(2, 5)}px`,
          animationDuration: `${rand(6, 12)}s`,
          animationDelay: `${rand(0, 8)}s`,
          opacity: rand(0.15, 0.4),
        },
      }));

    case 'stormy': {
      const rain = Array.from({ length: 45 }, (_, i) => ({
        type: 'raindrop',
        key: `r${i}`,
        style: {
          left: `${rand(0, 100)}%`,
          height: `${rand(15, 35)}px`,
          animationDuration: `${rand(0.4, 0.9)}s`,
          animationDelay: `${rand(0, 1.5)}s`,
          opacity: rand(0.12, 0.3),
        },
      }));
      rain.push({
        type: 'lightning',
        key: 'lightning',
        style: {
          animationDuration: `${rand(6, 10)}s`,
          animationDelay: `${rand(2, 5)}s`,
        },
      });
      return rain;
    }

    default:
      return null;
  }
}

export default function WeatherParticles({ mood }) {
  const particles = useMemo(() => generateParticles(mood), [mood]);

  if (!particles) return null;

  const reducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return null;

  return (
    <div className="weather-particles" aria-hidden="true">
      {particles.map((p) => {
        if (p.type === 'cloud') {
          return (
            <svg key={p.key} className="cloud-shape" style={p.style} viewBox="0 0 200 100" fill="currentColor">
              <ellipse cx="70" cy="60" rx="50" ry="30" />
              <ellipse cx="110" cy="50" rx="40" ry="25" />
              <ellipse cx="140" cy="60" rx="35" ry="22" />
              <ellipse cx="100" cy="70" rx="60" ry="25" />
            </svg>
          );
        }
        return <div key={p.key} className={`particle ${p.type}`} style={p.style} />;
      })}
    </div>
  );
}
