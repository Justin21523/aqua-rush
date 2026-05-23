import { useEffect, useRef } from 'react';

/**
 * Tracks which keys are currently held down.
 * Returns a stable ref whose `.current` object maps key names to booleans.
 *
 * Usage:
 *   const keys = useKeyboard();
 *   // inside useFrame: if (keys.current['ArrowLeft']) ...
 */
export function useKeyboard() {
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
      keys.current[e.code] = false;
    };
    const blur = () => {
      // Release all keys if the window loses focus to avoid stuck inputs.
      keys.current = {};
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  return keys;
}