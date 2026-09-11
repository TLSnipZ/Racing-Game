import { useEffect, useState } from 'react';
import type { ActiveJob } from '../domain/types';

/** Presentation-only clock shared by the HUD and job panel; never grants rewards. */
export function useJobClock(active: ActiveJob | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    refresh();
    if (!active) return;
    const timer = window.setInterval(refresh, 250);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [active?.runId, active?.startedAtMs, active?.finishesAtMs]);
  return now;
}
