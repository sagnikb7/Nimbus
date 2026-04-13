import { useMemo } from 'react';

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function generateParticles(mood) {
  if (!mood) return null;

  switch (mood) {
    // Warm amber circles rising — thermals / heat shimmer
    case 'clear':
      return Array.from({ length: 14 }, (_, i) => {
        const size = `${rand(4, 10)}px`;
        return {
          type: 'orb',
          key: i,
          style: {
            left: `${rand(5, 95)}%`,
            width: size,
            height: size,
            animationDuration: `${rand(16, 26)}s`,
            animationDelay: `${rand(0, 16)}s`,
            opacity: rand(0.10, 0.30),
          },
        };
      });

    // Purple circles pulsing in place — twinkling stars
    case 'night':
      return Array.from({ length: 30 }, (_, i) => {
        const size = `${rand(2, 5)}px`;
        return {
          type: 'star',
          key: i,
          style: {
            left: `${rand(2, 98)}%`,
            top: `${rand(2, 70)}%`,
            width: size,
            height: size,
            animationDuration: `${rand(3, 6)}s`,
            animationDelay: `${rand(0, 5)}s`,
            opacity: rand(0.10, 0.30),
          },
        };
      });

    // Slate circles drifting left→right — clouds in wind
    case 'cloudy':
      return Array.from({ length: 22 }, (_, i) => {
        const size = `${rand(15, 70)}px`;
        return {
          type: 'cloud-circle',
          key: i,
          style: {
            left: `${rand(0, 100)}%`,
            top: `${rand(0, 100)}%`,
            width: size,
            height: size,
            animationDuration: `${rand(20, 40)}s`,
            animationDelay: `${rand(0, 20)}s`,
            opacity: rand(0.06, 0.20),
          },
        };
      });

    // Blue circles falling fast — raindrops catching light
    case 'rainy':
      return Array.from({ length: 35 }, (_, i) => {
        const size = `${rand(3, 7)}px`;
        return {
          type: 'raindrop',
          key: i,
          style: {
            left: `${rand(0, 100)}%`,
            width: size,
            height: size,
            animationDuration: `${rand(1.0, 2.0)}s`,
            animationDelay: `${rand(0, 3)}s`,
            opacity: rand(0.12, 0.35),
          },
        };
      });

    // Ice-blue circles drifting down slowly — snowflakes
    case 'snowy':
      return Array.from({ length: 25 }, (_, i) => {
        const size = `${rand(3, 8)}px`;
        return {
          type: 'snowflake',
          key: i,
          style: {
            left: `${rand(0, 100)}%`,
            width: size,
            height: size,
            animationDuration: `${rand(6, 14)}s`,
            animationDelay: `${rand(0, 8)}s`,
            opacity: rand(0.15, 0.40),
          },
        };
      });

    // Violet circles falling hard + lightning flash
    case 'stormy': {
      const drops = Array.from({ length: 45 }, (_, i) => {
        const size = `${rand(3, 6)}px`;
        return {
          type: 'storm-drop',
          key: `d${i}`,
          style: {
            left: `${rand(0, 100)}%`,
            width: size,
            height: size,
            animationDuration: `${rand(0.6, 1.4)}s`,
            animationDelay: `${rand(0, 2)}s`,
            opacity: rand(0.12, 0.30),
          },
        };
      });
      drops.push({
        type: 'lightning',
        key: 'lightning',
        style: {
          animationDuration: `${rand(6, 10)}s`,
          animationDelay: `${rand(2, 5)}s`,
        },
      });
      return drops;
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
      {particles.map((p) => (
        <div key={p.key} className={`particle ${p.type}`} style={p.style} />
      ))}
    </div>
  );
}
