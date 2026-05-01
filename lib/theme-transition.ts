import { flushSync } from 'react-dom';

type SetThemeFn = (theme: string) => void;

/** Persists theme and remounts entrance-animation subtrees keyed to replay epoch (no reload). */
export function applyThemeWithEntranceReplay(
  setTheme: SetThemeFn,
  next: 'light' | 'dark',
  bumpEntranceAnimations: () => void
): void {
  flushSync(() => {
    setTheme(next);
  });
  bumpEntranceAnimations();
}
