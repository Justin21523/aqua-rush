import type { Vector3 } from 'three';

/**
 * Phases the game can be in. The App component uses this to switch overlays.
 */
export enum GamePhase {
  Menu = 'menu',
  Playing = 'playing',
  Paused = 'paused',
  GameOver = 'gameover',
}

/**
 * Snapshot of player state, stored in the Zustand store.
 * The 3D Player component reads/writes this each frame.
 */
export interface PlayerState {
  /** Distance travelled along the slide's main curve (parameter t in 0..1 per chunk). */
  distance: number;
  /** Lateral offset from the center of the slide (negative = left, positive = right). */
  lateralOffset: number;
  /** Current forward speed in units/second. */
  speed: number;
  /** World-space position, updated every frame. */
  position: Vector3;
  /** Whether the player is currently alive (false after crash). */
  alive: boolean;
}

/**
 * High-level run statistics surfaced to the HUD.
 */
export interface RunStats {
  score: number;
  coins: number;
  distance: number;
  bestScore: number;
}