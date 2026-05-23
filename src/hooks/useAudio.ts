import { useCallback, useRef } from 'react';

/**
 * Lightweight audio pool hook.
 * Creates multiple instances of an audio file so rapid triggers don't cut each other off.
 */
export function useAudio(src: string, poolSize = 3) {
  const poolRef = useRef<HTMLAudioElement[]>([]);
  const indexRef = useRef(0);

  // Initialize pool lazily
  if (poolRef.current.length === 0 && typeof window !== 'undefined') {
    for (let i = 0; i < poolSize; i++) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      poolRef.current.push(audio);
    }
  }

  const play = useCallback((volume = 0.5) => {
    const audio = poolRef.current[indexRef.current];
    if (audio) {
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Ignore autoplay errors (browsers require user interaction first)
      });
      indexRef.current = (indexRef.current + 1) % poolSize;
    }
  }, [poolSize]);

  return play;
}