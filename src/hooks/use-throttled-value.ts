import { useEffect, useRef, useState } from 'react';

export function useThrottledValue<T>(value: T, intervalMs = 150) {
  const [throttled, setThrottled] = useState<T>(value);
  const lastSetRef = useRef<number>(0);

  useEffect(() => {
    if (intervalMs <= 0) {
      setThrottled(value);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastSetRef.current;

    if (elapsed >= intervalMs) {
      lastSetRef.current = now;
      setThrottled(value);
      return;
    }

    const timeout = setTimeout(() => {
      lastSetRef.current = Date.now();
      setThrottled(value);
    }, intervalMs - elapsed);

    return () => clearTimeout(timeout);
  }, [value, intervalMs]);

  return throttled;
}

