import { useCallback, useEffect, useState } from 'react';

/** useState that persists to localStorage (JSON) and stays in sync across hook instances. */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const read = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : (JSON.parse(raw) as T);
    } catch {
      return initial;
    }
    // `initial` is expected to be a stable literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const [value, setValue] = useState<T>(read);

  useEffect(() => {
    setValue(read());
    const onChange = (e: Event) => {
      if ((e as CustomEvent<string>).detail === key) setValue(read());
    };
    window.addEventListener('kanbot:storage', onChange);
    return () => window.removeEventListener('kanbot:storage', onChange);
  }, [key, read]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(read()) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        /* storage unavailable */
      }
      setValue(resolved);
      window.dispatchEvent(new CustomEvent('kanbot:storage', { detail: key }));
    },
    [key, read],
  );

  return [value, set];
}
