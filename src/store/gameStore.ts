import { create } from 'zustand';
import { Vector3 } from 'three';
import { GamePhase } from '@/types/game';
import { GAME } from '@/utils/constants';

/**
 * Single source of truth for global game state.
 *
 * The store is deliberately small: it holds high-level flags (phase, score)
 * and a handful of player stats that the HUD needs. Per-frame transform
 * data stays inside the Player component to avoid needless re-renders.
 */

interface GameState {
  // ---- Phase -----------------------------------------------------------
  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;

  // ---- Run stats -------------------------------------------------------
  score: number;
  coins: number;
  distance: number;
  speed: number;
  bestScore: number;

  addCoins: (amount: number) => void;
  addDistance: (meters: number) => void;
  setSpeed: (speed: number) => void;

  // ---- Lifecycle -------------------------------------------------------
  /** Reset run stats and enter the Playing phase. */
  startRun: () => void;
  /** Freeze state and transition to GameOver. */
  endRun: () => void;

  // ---- Player position (lightweight mirror for UI / camera) ------------
  playerPosition: Vector3;
  setPlayerPosition: (p: Vector3) => void;
}

const loadBestScore = (): number => {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem('aquarush.bestScore');
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
};

const saveBestScore = (score: number) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('aquarush.bestScore', String(score));
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: GamePhase.Menu,
  setPhase: (phase) => set({ phase }),

  score: 0,
  coins: 0,
  distance: 0,
  speed: GAME.INITIAL_SPEED,
  bestScore: loadBestScore(),

  addCoins: (amount) =>
    set((s) => ({
      coins: s.coins + amount,
      score: s.score + amount * GAME.COIN_VALUE,
    })),

  addDistance: (meters) =>
    set((s) => ({
      distance: s.distance + meters,
      score: s.score + meters * GAME.SCORE_PER_METER,
    })),

  setSpeed: (speed) => set({ speed }),

  startRun: () =>
    set({
      phase: GamePhase.Playing,
      score: 0,
      coins: 0,
      distance: 0,
      speed: GAME.INITIAL_SPEED,
      playerPosition: new Vector3(0, 0, 0),
    }),

  endRun: () => {
    const { score, bestScore } = get();
    const newBest = Math.max(bestScore, Math.floor(score));
    if (newBest > bestScore) saveBestScore(newBest);
    set({ phase: GamePhase.GameOver, bestScore: newBest });
  },

  playerPosition: new Vector3(0, 0, 0),
  setPlayerPosition: (p) => set({ playerPosition: p.clone() }),
}));

// Re-export the enum so consumers can import from the store module.
export { GamePhase };