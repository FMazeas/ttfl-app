import { useState, useEffect, useRef } from 'react';

/**
 * Counts from 0 to `end` over `duration` ms with ease-out cubic.
 * Re-triggers whenever `end` changes.
 * Usage: const displayed = useCountUp(myNumber);
 */
export default function useCountUp(end, duration = 750) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (end == null || end === 0) { setValue(0); return; }
    let startTime = null;

    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [end, duration]);

  return value;
}
