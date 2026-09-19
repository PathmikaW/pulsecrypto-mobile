import { useEffect, useState } from 'react';

// JS-thread FPS via requestAnimationFrame; cheap and needs no native module (ADR-M10).
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
