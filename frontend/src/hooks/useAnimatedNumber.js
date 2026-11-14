import { useEffect, useState } from 'react';

export default function useAnimatedNumber(value, { duration = 700, enabled = true } = {}) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!enabled) {
      setDisplay(target);
      return undefined;
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduceMotion) {
      setDisplay(target);
      return undefined;
    }

    let frame = 0;
    const start = display;
    const delta = target - start;
    const startedAt = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(start + delta * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Intentionally depend on target only so reloads animate to the new metric.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, enabled]);

  return display;
}
