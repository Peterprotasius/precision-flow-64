import { useEffect, useRef, useState } from 'react';

export function useAnimatedCounter(
  end: number,
  duration = 800,
  decimals = 0,
  prefix = '',
  suffix = ''
): string {
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);
  const frameRef = useRef<number>();
  const prevEnd = useRef(0);

  useEffect(() => {
    const start = prevEnd.current;
    prevEnd.current = end;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration, decimals, prefix, suffix]);

  return display;
}
