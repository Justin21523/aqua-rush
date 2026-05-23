import { Vector3, MathUtils } from 'three';
import { ChunkShape, type SlideChunkData, type ChunkEntity, SceneryItem, SceneryType } from '@/types/slide';
import { SLIDE, DIFFICULTY } from '@/utils/constants';
import { pickRandom, shortId, chance } from '@/utils/math';
import { buildCurve, controlPointsForShape, exitDirection } from '@/utils/curves';
import type { CatmullRomCurve3 } from 'three';

const SCENERY_COLORS = {
  tower: ['#ff9a8b', '#a0e7e5', '#feca57', '#b181ff', '#ff6b9d'],
  slide: ['#ff6b9d', '#feca57', '#48dbfb', '#1dd1a1', '#b181ff', '#ff9ff3'],
  mountain: ['#7ba4c9', '#8cb4d4', '#85adc9', '#9bc0de', '#6e97b8'],
};

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

  /** Current yaw angle relative to +Z axis (radians). 0 = straight ahead. */
  private currentYaw = 0;

  /** Maximum allowed yaw deviation from main direction. */
  private readonly MAX_YAW = MathUtils.degToRad(35);

  /** Reset the generator to the world origin for a new run. */
  reset() {
    this.cursorPosition.set(0, 0, 0);
    this.cursorDirection.set(0, 0, 1);
    this.nextIndex = 0;
    this.chunks = [];
  }

  /** Generate one chunk and advance the cursor. */
  generateNext(): SlideChunkData {
    const shape = this.pickShapeWithDriftControl();

    const localPoints = controlPointsForShape(shape);
    // Transform local control points into world space using the cursor.
    const worldPoints = localPoints.map((p) =>
      this.transformToWorld(p),
    );

    const curve = buildCurve(worldPoints);
    const exit = exitDirection(curve);
    const exitPoint = curve.getPoint(1);
    const arcLength = curve.getLength();
    
    const chunkIndex = this.nextIndex++;

    // Update yaw tracking for next chunk's drift control
    this.currentYaw = Math.atan2(exit.x, exit.z);
    
    const chunk: SlideChunkData = {
      id: shortId('chunk'),
      shape,
      index: chunkIndex,
      start: this.cursorPosition.clone(),
      exitDirection: exit.clone(),
      controlPoints: worldPoints,
      curve,
      arcLength,
      entities: this.populateEntities(shape, chunkIndex),
      scenery: this.generateLayeredScenery(curve),
      color: pickRandom(SLIDE.PALETTE) ?? '#1ad1f2',
      length: arcLength,
    };

    this.cursorPosition.copy(exitPoint);
    this.cursorDirection.copy(exit);
    this.chunks.push(chunk);

    return chunk;
  }
  /**
   * Picks a chunk shape with drift control.
   * When the slide has yawed too far in one direction, we bias toward
   * shapes that turn it back toward the main forward direction (+Z).
   */
  private pickShapeWithDriftControl(): ChunkShape {
    // Base weights
    let wStraight = 0.45;
    let wCurveLeft = 0.20;
    let wCurveRight = 0.20;
    let wSlopeDown = 0.10;
    let wFork = 0.05;

    // Calculate how far we've drifted (-1 to 1 normalized)
    const driftRatio = MathUtils.clamp(this.currentYaw / this.MAX_YAW, -1, 1);

    // Apply drift correction
    if (driftRatio > 0.2) {
      // Yawed to the RIGHT (positive) → bias LEFT turns to bring it back
      const correction = driftRatio; // 0.2 to 1.0
      wCurveRight *= (1 - correction * 0.8); // Strongly reduce right turns
      wCurveLeft *= (1 + correction * 1.5);  // Boost left turns
      wStraight *= (1 + correction * 0.5);   // Slightly boost straight
    } else if (driftRatio < -0.2) {
      // Yawed to the LEFT (negative) → bias RIGHT turns
      const correction = -driftRatio;
      wCurveLeft *= (1 - correction * 0.8);
      wCurveRight *= (1 + correction * 1.5);
      wStraight *= (1 + correction * 0.5);
    }

    // Emergency correction: if we're near max yaw, almost force a correction
    if (Math.abs(driftRatio) > 0.85) {
      if (driftRatio > 0) {
        wCurveLeft *= 3;
        wCurveRight *= 0.1;
      } else {
        wCurveRight *= 3;
        wCurveLeft *= 0.1;
      }
    }

    // Weighted random selection
    const total = wStraight + wCurveLeft + wCurveRight + wSlopeDown + wFork;
    let roll = Math.random() * total;

    if ((roll -= wStraight) <= 0) return ChunkShape.Straight;
    if ((roll -= wCurveLeft) <= 0) return ChunkShape.CurveLeft;
    if ((roll -= wCurveRight) <= 0) return ChunkShape.CurveRight;
    if ((roll -= wSlopeDown) <= 0) return ChunkShape.SlopeDown;
    return ChunkShape.Fork;
  }


/**
   * Procedurally populates a chunk with coins, obstacles, and boosters.
   */
  private populateEntities(shape: ChunkShape, chunkIndex: number): ChunkEntity[] {
    const entities: ChunkEntity[] = [];
    
    // --- DIFFICULTY CURVE ---
    const obstacleChance = Math.min(
      DIFFICULTY.BASE_OBSTACLE_CHANCE + chunkIndex * DIFFICULTY.OBSTACLE_RAMP,
      DIFFICULTY.MAX_OBSTACLE_CHANCE
    );

    if (shape === ChunkShape.Fork) {
      // FORK LOGIC: Left side = Coins, Right side = Boosters + Obstacles
      for (let i = 0; i < 8; i++) {
        const t = 0.2 + (i / 8) * 0.6;
        // Left lane (-1) gets coins
        entities.push({ id: shortId('ent'), kind: 'coin', t, lane: -1, collected: false });
        
        // Right lane (1) gets boosters or obstacles
        const rightKind = chance(0.3) ? 'booster' : 'obstacle';
        entities.push({ id: shortId('ent'), kind: rightKind, t, lane: 1, collected: false });
      }
      return entities;
    }

    // --- NORMAL CHUNK LOGIC ---
    const entityCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < entityCount; i++) {
      // Spread entities evenly along the chunk, avoiding the very start/end
      const t = 0.15 + (i / entityCount) * 0.7 + (Math.random() * 0.05);
      const lane = pickRandom([-1, 0, 1]) as -1 | 0 | 1;
      
      let kind: 'coin' | 'obstacle' | 'booster' = 'coin';
      if (chance(obstacleChance)) {
        kind = 'obstacle';
      } else if (chance(0.05)) {
        kind = 'booster';
      } else {
        kind = 'coin';
      }

      entities.push({
        id: shortId('ent'),
        kind,
        t,
        lane,
        collected: false,
      });
    }

    return entities;
  }

  /** Current snapshot of live chunks (for React to render). */
  getChunks(): SlideChunkData[] {
    return this.chunks;
  }

  /**
   * Generates multi-layered scenery for a rich water park atmosphere.
   * - Near layer: dense trees and small decorations
   * - Mid layer: towers and secondary slides
   * - Far layer: mountains and large structures
   * - Sky layer: clouds
   */
  private generateLayeredScenery(curve: CatmullRomCurve3): SceneryItem[] {
    const items: SceneryItem[] = [];
    const worldUp = new Vector3(0, 1, 0);

    // Layer 1: Near (dense, small objects)
    this.spawnSceneryLayer(items, curve, worldUp, {
      clusters: 8,
      distanceMin: 15,
      distanceMax: 45,
      types: ['tree', 'tree', 'tree', 'tree', 'tower'],
      scaleMin: 1.0,
      scaleMax: 2.5,
      yBase: -8,
      skipChance: 0.1,
    });

    // Layer 2: Mid (medium density, thematic objects)
    this.spawnSceneryLayer(items, curve, worldUp, {
      clusters: 5,
      distanceMin: 55,
      distanceMax: 130,
      types: ['tower', 'bg-slide', 'tree', 'tower', 'bg-slide'],
      scaleMin: 3.0,
      scaleMax: 6.0,
      yBase: -5,
      skipChance: 0.15,
    });

    // Layer 3: Far (sparse, massive objects)
    this.spawnSceneryLayer(items, curve, worldUp, {
      clusters: 3,
      distanceMin: 150,
      distanceMax: 280,
      types: ['mountain', 'tower', 'mountain', 'bg-slide'],
      scaleMin: 8.0,
      scaleMax: 16.0,
      yBase: -12,
      skipChance: 0.2,
    });

    // Layer 4: Sky (clouds scattered high above)
    const cloudCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < cloudCount; i++) {
      const t = Math.random();
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      let right = new Vector3().crossVectors(worldUp, tangent).normalize();
      if (right.lengthSq() < 0.001) right.set(1, 0, 0);

      const side = Math.random() < 0.5 ? -1 : 1;
      const distance = 40 + Math.random() * 250;
      const pos = point.clone()
        .addScaledVector(right, side * distance);
      pos.y = 50 + Math.random() * 50;

      items.push({
        type: 'cloud',
        position: pos,
        scale: 5 + Math.random() * 10,
        rotationY: Math.random() * Math.PI * 2,
        colorHex: '#ffffff',
      });
    }

    return items;
  }

  
  private spawnSceneryLayer(
    items: SceneryItem[],
    curve: CatmullRomCurve3,
    worldUp: Vector3,
    config: {
      clusters: number;
      distanceMin: number;
      distanceMax: number;
      types: SceneryType[];
      scaleMin: number;
      scaleMax: number;
      yBase: number;
      skipChance: number;
    }
  ) {
    for (let i = 0; i < config.clusters; i++) {
      const t = (i + Math.random() * 0.8) / config.clusters;
      const point = curve.getPointAt(Math.min(t, 0.99));
      const tangent = curve.getTangentAt(Math.min(t, 0.99)).normalize();
      let right = new Vector3().crossVectors(worldUp, tangent).normalize();
      if (right.lengthSq() < 0.001) right.set(1, 0, 0);

      for (const side of [-1, 1]) {
        if (chance(config.skipChance)) continue;
        const distance = config.distanceMin + Math.random() * (config.distanceMax - config.distanceMin);
        const pos = point.clone().addScaledVector(right, side * distance);
        pos.y = config.yBase + Math.random() * 4;

        const type = pickRandom(config.types) || 'tree';
        const scale = config.scaleMin + Math.random() * (config.scaleMax - config.scaleMin);

        let colorHex = '#2d5a27';
        if (type === 'tower') colorHex = pickRandom(SCENERY_COLORS.tower) || '#ff9a8b';
        else if (type === 'bg-slide') colorHex = pickRandom(SCENERY_COLORS.slide) || '#48dbfb';
        else if (type === 'mountain') colorHex = pickRandom(SCENERY_COLORS.mountain) || '#7ba4c9';
        else if (type === 'tree') {
          // Slight hue variation for natural forest feel
          const hue = 100 + Math.random() * 40;
          const sat = 45 + Math.random() * 25;
          const lit = 22 + Math.random() * 18;
          colorHex = `hsl(${hue}, ${sat}%, ${lit}%)`;
        }

        items.push({
          type,
          position: pos,
          scale,
          rotationY: Math.random() * Math.PI * 2,
          colorHex,
        });
      }
    }
  }
  /**
   * Convert a chunk-local point (where +Z is the chunk's forward direction)
   * into world space using the cursor's current position and heading.
   */
  private transformToLocalToWorldish(local: Vector3): Vector3 {
    // Phase 1 simplification: we assume the cursor always faces roughly +Z,
    // with small deviations accumulated through exit directions.
    const forward = this.cursorDirection.clone().normalize();
    const worldUp = new Vector3(0, 1, 0);
    let right = new Vector3().crossVectors(worldUp, forward).normalize();
    if (right.lengthSq() < 0.001) right.set(1, 0, 0);
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