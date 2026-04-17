"use client";

import { useEffect, useState } from "react";

/** Seconds remaining until the given ISO instant; updates every second. */
export function useCountdownTo(isoInstant: string | null): number | null {
  const [remaining, setRemaining] = useState<number | null>(() =>
    isoInstant ? secondsUntil(isoInstant) : null
  );

  useEffect(() => {
    if (!isoInstant) {
      const f = requestAnimationFrame(() => setRemaining(null));
      return () => cancelAnimationFrame(f);
    }
    const init = requestAnimationFrame(() =>
      setRemaining(secondsUntil(isoInstant))
    );
    const id = window.setInterval(() => {
      setRemaining(secondsUntil(isoInstant));
    }, 1000);
    return () => {
      cancelAnimationFrame(init);
      window.clearInterval(id);
    };
  }, [isoInstant]);

  return remaining;
}

function secondsUntil(isoInstant: string): number {
  const end = new Date(isoInstant).getTime();
  if (!Number.isFinite(end)) return 0;
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / 1000));
}
