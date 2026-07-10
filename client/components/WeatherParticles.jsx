import { useMemo } from 'react';

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// Intensity scales how much precipitation you see: count, fall speed (as a
// duration multiplier — smaller = faster), and opacity.
const INTENSITY = {
  light:    { count: 0.55, dur: 1.3,  opacity: 0.7 },
  moderate: { count: 1.0,  dur: 1.0,  opacity: 1.0 },
  heavy:    { count: 1.6,  dur: 0.72, opacity: 1.3 },
};

// Base precipitation params per mood (pre-intensity).
const PRECIP = {
  rainy:  { type: 'raindrop',  count: 20, dur: [0.9, 1.7], opacity: [0.30, 0.55] },
  stormy: { type: 'storm-drop', count: 26, dur: [0.5, 1.1], opacity: [0.35, 0.6] },
  snowy:  { type: 'snowflake', count: 16, dur: [7, 14],   opacity: [0.5, 0.8] },
};

function makePrecip(mood, intensity) {
  const base = PRECIP[mood];
  if (!base) return [];
  const k = INTENSITY[intensity] || INTENSITY.moderate;
  const count = Math.round(base.count * k.count);

  return Array.from({ length: count }, (_, i) => {
    const isFlake = mood === 'snowy';
    const size = isFlake ? `${rand(3, 8)}px` : undefined;
    return {
      type: base.type,
      key: `${mood[0]}${i}`,
      style: {
        left: `${rand(0, 100)}%`,
        ...(isFlake ? { width: size, height: size } : {}),
        animationDuration: `${rand(base.dur[0], base.dur[1]) * k.dur}s`,
        animationDelay: `${rand(0, mood === 'snowy' ? 8 : 3)}s`,
        opacity: Math.min(0.9, rand(base.opacity[0], base.opacity[1]) * k.opacity),
      },
    };
  });
}

function generateParticles(mood, period, intensity) {
  if (!mood) return null;

  // Clear-night stars are the only decorative particle we keep; clear days and
  // cloudy skies rely on the living-sky backdrop alone.
  if (mood === 'clear') {
    if (period !== 'night') return null;
    return Array.from({ length: 18 }, (_, i) => {
      const size = `${rand(2, 5)}px`;
      return {
        type: 'star',
        key: `s${i}`,
        style: {
          left: `${rand(2, 98)}%`,
          top: `${rand(2, 70)}%`,
          width: size,
          height: size,
          animationDuration: `${rand(3, 6)}s`,
          animationDelay: `${rand(0, 5)}s`,
          opacity: rand(0.1, 0.3),
        },
      };
    });
  }

  if (mood === 'cloudy') return null;

  const drops = makePrecip(mood, intensity);
  if (mood === 'stormy') {
    drops.push({
      type: 'lightning',
      key: 'lightning',
      style: {
        animationDuration: `${rand(6, 10)}s`,
        animationDelay: `${rand(2, 5)}s`,
      },
    });
  }
  return drops.length ? drops : null;
}

export default function WeatherParticles({ mood, period, intensity }) {
  const particles = useMemo(
    () => generateParticles(mood, period, intensity),
    [mood, period, intensity]
  );

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
