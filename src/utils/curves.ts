import { CatmullRomCurve3, Matrix4, Quaternion, Vector3 } from 'three';
import { SLIDE, ENTITY } from './constants';
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
    // ... (apply L to other shapes similarly)
    case ChunkShape.Fork:
      // Fork is mostly straight but long
      return [new Vector3(0, 0, 0), new Vector3(0, -2, L)];
    default:
      return [new Vector3(0, 0, 0), new Vector3(0, 0, L)];
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

/**
 * Computes the world-space position and orientation for an entity 
 * placed inside a slide chunk.
 */
export function getEntityTransform(
  curve: CatmullRomCurve3,
  t: number,
  lane: -1 | 0 | 1
) {
  const point = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  
  const worldUp = new Vector3(0, 1, 0);
  let right = new Vector3().crossVectors(worldUp, tangent).normalize();
  if (right.lengthSq() < 0.001) right.set(1, 0, 0);
  const localUp = new Vector3().crossVectors(tangent, right).normalize();

  const position = point
    .clone()
    .addScaledVector(right, lane * ENTITY.LANE_WIDTH)
    .addScaledVector(localUp, 0.6); 

  // Calculate rotation so the entity aligns with the slide's flow
  const lookAtPoint = position.clone().add(tangent);
  const matrix = new Matrix4().lookAt(position, lookAtPoint, localUp);
  const quaternion = new Quaternion().setFromRotationMatrix(matrix);

  return { position, quaternion, right, localUp, tangent };
}