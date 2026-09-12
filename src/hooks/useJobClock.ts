import { useEffect, useState } from 'react';

type TimedActivity = { runId: number; startedAtMs: number; finishesAtMs: number };
/** Shared presentation clock for HUD, jobs and races. It never grants rewards or writes a save. */
export function useJobClock(active: TimedActivity | null, continuous = false): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    refresh();
    if (!active && !continuous) return;
    const timer = window.setInterval(refresh, 250);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [active?.runId, active?.startedAtMs, active?.finishesAtMs, continuous]);
  return now;
}
