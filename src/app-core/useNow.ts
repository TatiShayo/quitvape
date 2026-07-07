/** Ticking clock hook for live counters. Pauses when the app is backgrounded. */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    function start() {
      if (timer) return;
      setNow(new Date());
      timer = setInterval(() => setNow(new Date()), intervalMs);
    }
    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    start();
    const sub = AppState.addEventListener('change', (s) => (s === 'active' ? start() : stop()));
    return () => {
      stop();
      sub.remove();
    };
  }, [intervalMs]);

  return now;
}
