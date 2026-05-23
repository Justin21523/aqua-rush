import { useFrame } from '@react-three/fiber';
import { useGameStore, GamePhase } from '@/store/gameStore';

/**
 * Central game-loop hook.
 *
 * useFrame runs once per rendered frame inside the R3F Canvas. We use it
 * as the heartbeat of the game: every system that needs per-frame updates
 * registers a callback here.
 *
 * When the game is not in the Playing phase, the loop is paused so physics
 * and generation stop, but rendering still happens (nice for pause screens).
 */
export function useGameLoop(updater: (dt: number) => void) {
  const phase = useGameStore((s) => s.phase);

  useFrame((_state, delta) => {
    if (phase !== GamePhase.Playing) return;
    // Cap delta to avoid huge jumps after tab-switches.
    const dt = Math.min(delta, 1 / 30);
    updater(dt);
  });
}