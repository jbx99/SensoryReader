import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      setStored(value);
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // localStorage full or unavailable
      }
    },
    [key]
  );

  return [stored, setValue];
}
