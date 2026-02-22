"use client";

import { useState, useEffect } from "react";

export function usePersistedState<T>(key: string, defaultValue: T): [T, (val: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
    setHydrated(true);
  }, [key]);

  // Save to localStorage on change (skip initial hydration)
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Ignore quota errors
      }
    }
  }, [key, value, hydrated]);

  return [value, setValue];
}
