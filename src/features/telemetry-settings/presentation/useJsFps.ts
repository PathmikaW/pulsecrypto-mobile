import { useEffect, useState } from 'react';

// Real JS-thread frame rate via requestAnimationFrame — cheap to measure, no native module
// needed (ADR-M10: metrics that ARE cheaply real, like this one, get wired to actual
// values rather than a static number).
export function useJsFps(): number {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let windowStart = Date.now();
    let rafId: number;

    const tick = () => {
      frameCount += 1;
      const elapsed = Date.now() - windowStart;
      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed));
        frameCount = 0;
        windowStart = Date.now();
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}
