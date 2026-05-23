import { CatmullRomCurve3, Vector3 } from 'three';
import { SLIDE } from './constants';
import { ChunkShape } from '@/types/slide';

/**
 * Helpers for building splines that describe each slide chunk.
 *
 * Every chunk starts at the origin of its local frame and exits in a known
 * direction. The SlideGenerator chains chunks together by translating and
 * rotating each one so its start matches the previous chunk's exit.
 */

/**
 * Build an array of control points (in chunk-local space) for a given shape.
 * The first point is always (0,0,0); the last point is the chunk's exit.
 */
export function controlPointsForShape(shape: ChunkShape): Vector3[] {
  const L = SLIDE.CHUNK_LENGTH;
  switch (shape) {
    case ChunkShape.Straight:
      return [new Vector3(0, 0, 0), new Vector3(0, 0, L)];

    case ChunkShape.CurveLeft:
      return [
        new Vector3(0, 0, 0),
        new Vector3(-4, -1, L * 0.33),
        new Vector3(-8, -2, L * 0.66),
        new Vector3(-6, -3, L),
      ];

    case ChunkShape.CurveRight:
      return [
        new Vector3(0, 0, 0),
        new Vector3(4, -1, L * 0.33),
        new Vector3(8, -2, L * 0.66),
        new Vector3(6, -3, L),
      ];

    case ChunkShape.SlopeDown:
      return [
        new Vector3(0, 0, 0),
        new Vector3(0, -4, L * 0.5),
        new Vector3(0, -8, L),
      ];

    case ChunkShape.Jump:
      return [
        new Vector3(0, 0, 0),
        new Vector3(0, 2, L * 0.3),
        new Vector3(0, -2, L * 0.6),
        new Vector3(0, -3, L),
      ];

    case ChunkShape.Fork:
      // For Phase 1 we treat forks as straight; we'll branch later.
      return [new Vector3(0, 0, 0), new Vector3(0, -1, L)];
  }
}

/**
 * Build a CatmullRomCurve3 from a chunk's control points.
 * Centripetal parameterization avoids kinks on sharp curves.
 */
export function buildCurve(points: Vector3[]): CatmullRomCurve3 {
  return new CatmullRomCurve3(points, false, 'centripetal', 0.5);
}

/**
 * Compute the exit direction of a curve (tangent at t = 1), normalized.
 */
export function exitDirection(curve: CatmullRomCurve3): Vector3 {
  return curve.getTangent(1).normalize();
}