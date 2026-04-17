"use client";

import { useEffect, useState } from "react";

/**
 * Derives whole seconds remaining until `blockedUntilMs`, updates ~4x/sec near zero.
 * Calls `onUnblock` once when crossing to 0.
 */
export function useBlockedCooldown(
  blockedUntilMs: number | null,
  onUnblock?: () => void
): number {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!blockedUntilMs) {
      const f = requestAnimationFrame(() => setSecondsLeft(0));
      return () => cancelAnimationFrame(f);
    }

    let fired = false;
    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((blockedUntilMs - Date.now()) / 1000)
      );
      setSecondsLeft(left);
      if (left === 0 && !fired) {
        fired = true;
        onUnblock?.();
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [blockedUntilMs, onUnblock]);

  return secondsLeft;
}
