import { useState, useEffect, useRef } from 'react';

export default function useAnimatedNumber(target, duration = 500) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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
