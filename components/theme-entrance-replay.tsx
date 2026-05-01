'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ThemeEntranceReplayContextValue = {
  epoch: number;
  bumpEntranceAnimations: () => void;
};

const ThemeEntranceReplayContext =
  createContext<ThemeEntranceReplayContextValue | null>(null);

export function ThemeEntranceReplayProvider({ children }: { children: ReactNode }) {
  const [epoch, setEpoch] = useState(0);
  const bumpEntranceAnimations = useCallback(() => {
    setEpoch((e) => e + 1);
  }, []);
  const value = useMemo(
    () => ({ epoch, bumpEntranceAnimations }),
    [epoch, bumpEntranceAnimations]
  );

  return (
    <ThemeEntranceReplayContext.Provider value={value}>
      {children}
    </ThemeEntranceReplayContext.Provider>
  );
}

export function useThemeEntranceReplay() {
  const ctx = useContext(ThemeEntranceReplayContext);
  if (!ctx) {
    throw new Error(
      'useThemeEntranceReplay must be used within ThemeEntranceReplayProvider'
    );
  }
  return ctx;
}
