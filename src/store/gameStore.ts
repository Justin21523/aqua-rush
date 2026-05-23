import { create } from 'zustand';
import { Vector3 } from 'three';
import { GamePhase } from '@/types/game';
import { GAME, ENTITY } from '@/utils/constants';
import type { SlideChunkData } from '@/types/slide';

/**
 * Single source of truth for global game state.
 *
 * The store is deliberately small: it holds high-level flags (phase, score)
 * and a handful of player stats that the HUD needs. Per-frame transform
 * data stays inside the Player component to avoid needless re-renders.
 */
// ... (imports)

interface RunRecord {
  score: number;
  distance: number;
  date: string;
}


const loadLeaderboard = (): RunRecord[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem('aquarush.leaderboard');
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLeaderboard = (board: RunRecord[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('aquarush.leaderboard', JSON.stringify(board));
};

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
  
  // ---- Slide Generation ------------------------------------------------
  chunks: SlideChunkData[];
  setChunks: (chunks: SlideChunkData[]) => void;
  
  /** The index of the chunk the player is currently inside. */
  currentChunkIndex: number;
  setCurrentChunkIndex: (index: number) => void;
  
  // ---- Player position (lightweight mirror for UI / camera) ------------
  playerPosition: Vector3;
  setPlayerPosition: (p: Vector3) => void;
  
  /** The forward direction of the player (tangent to the curve). */
  playerForward: Vector3;
  setPlayerForward: (v: Vector3) => void;
  
  /** Timestamp (ms) when the current boost effect ends. */
  boostUntil: number;
  applyBoost: () => void;
  
  /** Mark a specific entity as collected so it disappears. */
  collectEntity: (chunkId: string, entityId: string) => void;

  // --- DEBUG ---
  isGodMode: boolean;
  toggleGodMode: () => void;
  leaderboard: RunRecord[];
}

const loadBestScore = (): number => {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem('aquarush.bestScore');
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) ? n : 0;
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: GamePhase.Menu,
  setPhase: (phase) => set({ phase }),

  score: 0,
  coins: 0,
  distance: 0,
  speed: GAME.INITIAL_SPEED,
  bestScore: loadBestScore(),
  leaderboard: loadLeaderboard(),

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
      chunks: [],
      currentChunkIndex: 0,
      playerPosition: new Vector3(0, 0, 0),
      playerForward: new Vector3(0, 0, 1),
      boostUntil: 0, // Reset boost
    }),

  endRun: () => {
    const { score, distance, leaderboard } = get();
    const finalScore = Math.floor(score);
    
    const newRecord: RunRecord = {
      score: finalScore,
      distance: Math.floor(distance),
      date: new Date().toLocaleDateString(),
    };

    // Add, sort descending, and keep top 5
    const updatedBoard = [...leaderboard, newRecord]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    saveLeaderboard(updatedBoard);

    set({ 
      phase: GamePhase.GameOver, 
      leaderboard: updatedBoard,
      bestScore: updatedBoard[0]?.score || 0 
    });
  },

  chunks: [],
  setChunks: (chunks) => set({ chunks }),
  
  currentChunkIndex: 0,
  setCurrentChunkIndex: (index) => set({ currentChunkIndex: index }),

  playerPosition: new Vector3(0, 0, 0),
  setPlayerPosition: (p) => set({ playerPosition: p.clone() }),
  
  playerForward: new Vector3(0, 0, 1),
  setPlayerForward: (v) => set({ playerForward: v.clone() }),
  
  boostUntil: 0,
  applyBoost: () => set({ boostUntil: Date.now() + ENTITY.BOOST_DURATION_MS }),

  collectEntity: (chunkId, entityId) =>
    set((state) => ({
      chunks: state.chunks.map((chunk) => {
        if (chunk.id !== chunkId) return chunk;
        return {
          ...chunk,
          entities: chunk.entities.map((e) =>
            e.id === entityId ? { ...e, collected: true } : e
          ),
        };
      }),
    })),
  
    // --- DEBUG ---
  isGodMode: true, // Default to true for easy testing
  toggleGodMode: () => set((s) => ({ isGodMode: !s.isGodMode })),
  
}));


// Re-export the enum so consumers can import from the store module.
export { GamePhase };