import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Wraps useFocusEffect with a cancel flag so async work that finishes
 * after the screen is blurred / unmounted does not call setState.
 *
 * Usage:
 *   useFocusedFetch(async (signal) => {
 *     const res = await client.get('/foo');
 *     if (signal.cancelled) return;
 *     setData(res.data);
 *   }, []);
 */
export function useFocusedFetch(
  effect: (signal: { cancelled: boolean }) => void | Promise<void>,
  deps: React.DependencyList = []
) {
  // Keep a ref to the latest effect so callers don't have to memoize their
  // closure — only `deps` controls when the focus callback re-binds.
  const effectRef = useRef(effect);
  effectRef.current = effect;

  const onFocus = useCallback(() => {
    const signal = { cancelled: false };
    void effectRef.current(signal);
    return () => { signal.cancelled = true; };
    // deps come from the caller and govern re-binding intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(onFocus);
}
