import { useRef } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore, GamePhase } from '@/store/gameStore';
import { useKeyboard } from '@/hooks/useKeyboard';
import { computeLateralOffset } from './PlayerController';
import { PLAYER } from '@/utils/constants';

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
  const meshRef = useRef<Mesh>(null);
  const keys = useKeyboard();
  const phase = useGameStore((s) => s.phase);

  // Local mutable state (kept out of React to avoid per-frame re-renders).
  const lateralRef = useRef(0);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (phase === GamePhase.Playing) {
      const input = {
        left: Boolean(keys.current['a'] || keys.current['A'] || keys.current['ArrowLeft']),
        right: Boolean(keys.current['d'] || keys.current['D'] || keys.current['ArrowRight']),
      };
      lateralRef.current = computeLateralOffset(lateralRef.current, input, delta);
    }

    // Apply position + a cosmetic spin so the ball looks alive.
    mesh.position.x = lateralRef.current;
    mesh.rotation.z -= delta * 3;
    mesh.rotation.x -= delta * 2;
  });

  return (
    <mesh ref={meshRef} castShadow position={[0, PLAYER.RADIUS, 0]}>
      <sphereGeometry args={[PLAYER.RADIUS, 32, 32]} />
      <meshStandardMaterial
        color={PLAYER.COLOR}
        emissive={PLAYER.COLOR}
        emissiveIntensity={PLAYER.EMISSIVE_INTENSITY}
        metalness={0.2}
        roughness={0.3}
      />
    </mesh>
  );
}