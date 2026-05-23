import type { Vector3, CatmullRomCurve3 } from 'three';

export type SceneryType = 'tree' | 'tower' | 'bg-slide' | 'cloud' | 'mountain';

export interface SceneryItem {
  type: SceneryType;
  position: Vector3;
  scale: number;
  rotationY: number;
  colorHex: string;
}

/**
 * Every chunk of the waterslide has a "shape" that determines its geometry.
 * These are the basic building blocks the SlideGenerator composes together.
 */
export enum ChunkShape {
  Straight = 'straight',
  CurveLeft = 'curve-left',
  CurveRight = 'curve-right',
  SlopeDown = 'slope-down',
  Jump = 'jump',
  Fork = 'fork',
}

/**
 * Difficulty bucket used by the generator to scale parameters.
 */
export enum DifficultyTier {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

/**
 * An interactive element placed inside a chunk (obstacle, coin, booster).
 * Positions are stored in chunk-local coordinates:
 *   - t:    0..1 along the chunk's spline
 *   - lane: -1 (left), 0 (center), 1 (right)
 */
export interface ChunkEntity {
  id: string;
  kind: 'coin' | 'obstacle' | 'booster';
  t: number;
  lane: -1 | 0 | 1;
  collected?: boolean;
}

/**
 * A single generated chunk of the waterslide.
 * The SlideGenerator produces these; SlideChunk renders them.
 */
export interface SlideChunkData {
  id: string;
  shape: ChunkShape;
  /** Index in the generation sequence (0 = starting chunk). */
  index: number;
  /** World-space position where this chunk begins. */
  start: Vector3;
  /** World-space direction this chunk exits toward (normalized). */
  exitDirection: Vector3;
  /** Ordered list of control points used to build the chunk's spline. */
  controlPoints: Vector3[];
  /** 
   * The pre-computed Three.js curve. 
   * Storing it here avoids recalculating it every frame in the Player component.
   */
  curve: CatmullRomCurve3;
  /** 
   * The actual physical length of the curve in world units.
   * Crucial for calculating uniform movement speed.
   */
  arcLength: number; 
  /** Entities placed inside this chunk. */
  entities: ChunkEntity[];
  /** Base color of the slide tube. */
  color: string;
  /** Length of the chunk in world units. */
  length: number;
  /** Background scenery items generated alongside this chunk. */
  scenery: SceneryItem[]; 
}