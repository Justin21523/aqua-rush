import { Vector3 } from 'three';

/**
 * Pure numeric helpers used throughout the game.
 * Kept free of side effects so they are easy to test.
 */

/** Clamp a number between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation between a and b by t in 0..1. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Exponential smoothing helper. Given a current value, a target value,
 * a rate, and a delta time, returns a new value eased toward the target.
 * Useful for camera follow and other "smooth to target" behaviors.
 */
export function smoothDamp(
  current: number,
  target: number,
  rate: number,
  dt: number,
): number {
  return lerp(current, target, 1 - Math.exp(-rate * dt));
}

/**
 * Pick a random element from an array. Returns undefined if the array is empty.
 */
export function pickRandom<T>(arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns true with probability `chance` (0..1).
 */
export function chance(chance: number): boolean {
  return Math.random() < chance;
}

/**
 * Generate a stable short ID. Good enough for in-game entity keys.
 */
export function shortId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Create a Vector3 from a plain object. Handy when reading constants. */
export function vec3(x: number, y: number, z: number): Vector3 {
  return new Vector3(x, y, z);
}