import { useState, useEffect, useRef } from 'react';

// Animates a number ONLY when the target changes while mounted — e.g. the
// °C↔°F toggle (25→77) or a refresh delta. On first mount it shows the real
// value immediately; the entrance is carried by the CSS reveal (tempReveal),
// not a count-up from zero. A focal number that was never actually 0 rolling
// up from 0 on every city load read as a gimmick rather than as weather.
export default function useAnimatedNumber(target, duration = 550) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;

    // No meaningful change (incl. first mount) — snap, don't animate.
    if (Math.abs(diff) < 0.5) {
      setDisplay(target);
      prevRef.current = target;
      return;
    }

    const startTime = performance.now();

    function animate(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      // ease-out cubic: moves immediately, decelerates into place. The old
      // ease-in-out quartic sat near the start value then snapped through.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}
