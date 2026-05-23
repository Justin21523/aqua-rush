import { Vector3 } from 'three';
import { ChunkShape, type SlideChunkData } from '@/types/slide';
import { SLIDE } from '@/utils/constants';
import { pickRandom, shortId } from '@/utils/math';
import { buildCurve, controlPointsForShape, exitDirection } from '@/utils/curves';

/**
 * Procedural slide generator (Phase 1: stub).
 *
 * In Phase 2 this class will:
 *   - Track a "cursor" (position + heading) at the end of the last chunk.
 *   - Pick the next shape based on difficulty and weighted probabilities.
 *   - Emit fully-formed SlideChunkData objects ready for rendering.
 *   - Cull chunks that fall too far behind the player.
 *
 * For Phase 1 we expose the API surface so the rest of the codebase can
 * start depending on it, but only a single straight chunk is produced.
 */
export class SlideGenerator {
  private cursorPosition = new Vector3(0, 0, 0);
  private cursorDirection = new Vector3(0, 0, 1);
  private nextIndex = 0;
  private chunks: SlideChunkData[] = [];

  /** Generate one chunk and advance the cursor. */
  generateNext(): SlideChunkData {
    const shape = this.pickShape();
    const localPoints = controlPointsForShape(shape);

    // Transform local control points into world space using the cursor.
    const worldPoints = localPoints.map((p) =>
      this.transformToWorld(p),
    );

    const curve = buildCurve(worldPoints);
    const exit = exitDirection(curve);
    const exitPoint = curve.getPoint(1);

    const chunk: SlideChunkData = {
      id: shortId('chunk'),
      shape,
      index: this.nextIndex++,
      start: this.cursorPosition.clone(),
      exitDirection: exit.clone(),
      controlPoints: worldPoints,
      entities: [],
      color: pickRandom(SLIDE.PALETTE) ?? '#1ad1f2',
      length: SLIDE.CHUNK_LENGTH,
    };

    // Advance cursor for the next chunk.
    this.cursorPosition.copy(exitPoint);
    this.cursorDirection.copy(exit);

    this.chunks.push(chunk);
    return chunk;
  }

  /** Current snapshot of live chunks (for React to render). */
  getChunks(): SlideChunkData[] {
    return this.chunks;
  }

  /** Pick a shape based on simple weights. Expanded in later phases. */
  private pickShape(): ChunkShape {
    const roll = Math.random();
    if (roll < 0.55) return ChunkShape.Straight;
    if (roll < 0.75) return ChunkShape.CurveLeft;
    if (roll < 0.95) return ChunkShape.CurveRight;
    return ChunkShape.SlopeDown;
  }

  /**
   * Convert a chunk-local point (where +Z is the chunk's forward direction)
   * into world space using the cursor's current position and heading.
   */
  private transformToLocalToWorldish(local: Vector3): Vector3 {
    // Phase 1 simplification: we assume the cursor always faces roughly +Z,
    // with small deviations accumulated through exit directions.
    const forward = this.cursorDirection.clone().normalize();
    const up = new Vector3(0, 1, 0);
    const right = new Vector3().crossVectors(up, forward).normalize();
    const realUp = new Vector3().crossVectors(forward, right).normalize();

    return this.cursorPosition
      .clone()
      .addScaledVector(right, local.x)
      .addScaledVector(realUp, local.y)
      .addScaledVector(forward, local.z);
  }

  // Alias to keep the call site readable.
  private transformToWorld = this.transformToLocalToWorldish.bind(this);
}