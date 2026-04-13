import { useState, useEffect, useRef } from 'react';

export default function useAnimatedNumber(target, duration = 800) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;

    if (Math.abs(diff) < 0.5) {
      setDisplay(target);
      prevRef.current = target;
      return;
    }

    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Spring-style easing: slow start, accelerates, then settles gently
      // ease-in-out quartic for a more dynamic feel
      const eased = progress < 0.5
        ? 8 * progress * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 4) / 2;

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
