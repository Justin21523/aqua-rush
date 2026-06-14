import { useRef } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore, GamePhase } from '@/store/gameStore';
import { useKeyboard } from '@/hooks/useKeyboard';
import { computeLateralOffset } from './PlayerController';
import { PLAYER, GAME, ENTITY } from '@/utils/constants';
import { clamp } from '@/utils/math';
import { DIFFICULTY } from '@/utils/constants';

/**
 * The player's rolling ball.
 *
 * Phase 1 behavior (placeholder):
 *   - The ball sits at the origin and can strafe left/right with A/D or arrows.
 *   - It spins visually to hint at the "rolling" feel.
 *
 * In Phase 2 the ball will instead move along a generated slide spline,
 * with the lateralOffset applied perpendicular to the curve tangent.
 */
export default function Player() {
  const isGodMode = useGameStore((s) => s.isGodMode);
  const meshRef = useRef<Mesh>(null);
  const keys = useKeyboard();

  const phase = useGameStore((s) => s.phase);
  const chunks = useGameStore((s) => s.chunks);
  const currentChunkIndex = useGameStore((s) => s.currentChunkIndex);
  const setCurrentChunkIndex = useGameStore((s) => s.setCurrentChunkIndex);
  const addDistance = useGameStore((s) => s.addDistance);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const setPlayerForward = useGameStore((s) => s.setPlayerForward);

  const playCoin = useAudio('/sounds/coin.mp3', 8); // Pool of 8 for rapid collection
  const playBoost = useAudio('/sounds/boost.mp3', 2);
  const playCrash = useAudio('/sounds/crash.mp3', 1);
  
  // Interactivity store hooks
  const addCoins = useGameStore((s) => s.addCoins);
  const applyBoost = useGameStore((s) => s.applyBoost);
  const boostUntil = useGameStore((s) => s.boostUntil);
  const collectEntity = useGameStore((s) => s.collectEntity);
  const endRun = useGameStore((s) => s.endRun);
  
  const isBoosted = Date.now() < boostUntil;
  const tRef = useRef(0);
  const lateralRef = useRef(0);
  const distance = useGameStore((s) => s.distance); // Read distance for difficulty

  // Pre-allocated scratch vectors — avoids 6+ new Vector3() per frame
  const _worldUp = useRef(new Vector3(0, 1, 0));
  const _right = useRef(new Vector3());
  const _localUp = useRef(new Vector3());
  const _pos = useRef(new Vector3());
  const _entRight = useRef(new Vector3());
  const _entWorldPos = useRef(new Vector3());

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh || phase !== GamePhase.Playing) return;

    const chunk = chunks.find((c) => c.index === currentChunkIndex);
    if (!chunk) return;

    const { arcLength } = chunk;

    // 1. Determine current speed (Base + Boost + Difficulty Ramp)
    const isBoosted = Date.now() < boostUntil;
    const difficultySpeedBonus = Math.min(
      distance * 0.01, // Speed increases as you travel further
      DIFFICULTY.MAX_SPEED - GAME.INITIAL_SPEED
    );
    
    const baseSpeed = GAME.INITIAL_SPEED + difficultySpeedBonus;
    const currentSpeed = isBoosted 
      ? baseSpeed * GAME.BOOST_MULTIPLIER 
      : baseSpeed;
    setSpeed(currentSpeed);

    // 2. Calculate forward movement
    const distanceMoved = currentSpeed * delta;
    const tDelta = distanceMoved / arcLength;
    tRef.current += tDelta;

    // Update global distance for scoring
    addDistance(distanceMoved);

    // 2. Handle chunk transition (robust to large delta or lag spikes)
    let activeChunk = chunk;
    while (tRef.current >= 1) {
      tRef.current -= 1; // Carry over the remainder
      
      const nextIndex = activeChunk.index + 1;
      const nextChunk = chunks.find((c) => c.index === nextIndex);
      
      if (nextChunk) {
        activeChunk = nextChunk;
        setCurrentChunkIndex(nextIndex);
      } else {
        // Failsafe: The next chunk hasn't been generated yet (rare, but possible on extreme lag).
        // Clamp t to 0.9999 and wait for the next frame.
        tRef.current = 0.9999;
        break;
      }
    }

    // 4. Calculate position on the curve (use activeChunk after any chunk transition)
    const t = clamp(tRef.current, 0, 1);
    const point = activeChunk.curve.getPointAt(t);
    const tangent = activeChunk.curve.getTangentAt(t).normalize();

    // 5. Compute local coordinate frame (Frenet-Serret simplified)
    // Reuse scratch refs — no new Vector3() allocations per frame
    _right.current.crossVectors(_worldUp.current, tangent).normalize();
    if (_right.current.lengthSq() < 0.001) _right.current.set(1, 0, 0);
    _localUp.current.crossVectors(tangent, _right.current).normalize();

    // 6. Apply lateral input
    const input = {
      left: Boolean(keys.current['a'] || keys.current['A'] || keys.current['ArrowLeft']),
      right: Boolean(keys.current['d'] || keys.current['D'] || keys.current['ArrowRight']),
    };
    lateralRef.current = computeLateralOffset(lateralRef.current, input, delta);

    // 7. Compute final world position into scratch ref
    _pos.current
      .copy(point)
      .addScaledVector(_right.current, lateralRef.current)
      .addScaledVector(_localUp.current, PLAYER.RADIUS);

    mesh.position.copy(_pos.current);
    mesh.rotation.z -= delta * (isBoosted ? 8 : 3);

    // 8. Update store for Camera and UI
    setPlayerPosition(_pos.current);
    setPlayerForward(tangent);

    // 9. Collision detection against the active chunk
    checkCollisions(activeChunk, _pos.current);
  });



  /**
   * Checks distance between the player and entities in the active chunk.
   * Uses squared distance to avoid Math.sqrt(), and reuses scratch Vector3 refs
   * so zero heap allocations occur per call.
   */
  function checkCollisions(chunkData: typeof chunks[0], playerPos: Vector3) {
    const { id: chunkId, entities, curve } = chunkData;
    const playerRadius = PLAYER.RADIUS;

    for (const entity of entities) {
      if (entity.collected) continue;

      let entityRadius = 0;
      if (entity.kind === 'coin') entityRadius = ENTITY.COIN_RADIUS;
      else if (entity.kind === 'obstacle') entityRadius = ENTITY.OBSTACLE_RADIUS;
      else if (entity.kind === 'booster') entityRadius = ENTITY.BOOSTER_RADIUS;

      const threshold = (playerRadius + entityRadius) * ENTITY.FORGIVENESS;
      const thresholdSq = threshold * threshold;

      const entPos = curve.getPointAt(entity.t);
      const entTangent = curve.getTangentAt(entity.t).normalize();

      _entRight.current.crossVectors(_worldUp.current, entTangent).normalize();
      if (_entRight.current.lengthSq() < 0.001) _entRight.current.set(1, 0, 0);
      _entWorldPos.current.copy(entPos).addScaledVector(_entRight.current, entity.lane * ENTITY.LANE_WIDTH);

      const distSq = playerPos.distanceToSquared(_entWorldPos.current);

      if (distSq < thresholdSq) {
        if (entity.kind === 'coin') {
          addCoins(1);
          collectEntity(chunkId, entity.id);
          playCoin(0.4);
        } else if (entity.kind === 'booster') {
          applyBoost();
          collectEntity(chunkId, entity.id);
          playBoost(0.8);
        } else if (entity.kind === 'obstacle') {
          playCrash(1.0);
          if (!isGodMode) {
            endRun();
          }
        }
      }
    }
  }


  return (
    <mesh ref={meshRef} castShadow>
      <sphereGeometry args={[PLAYER.RADIUS, 24, 24]} />
      <meshStandardMaterial
        color={PLAYER.COLOR}
        emissive={isBoosted ? '#00ffff' : PLAYER.COLOR}
        emissiveIntensity={isBoosted ? 0.8 : PLAYER.EMISSIVE_INTENSITY}
        metalness={0.2}
        roughness={0.3}
      />
    </mesh>
  );
}
