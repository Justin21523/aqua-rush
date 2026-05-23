import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3, AdditiveBlending } from 'three';
import { useGameStore, GamePhase } from '@/store/gameStore';
import { GAME } from '@/utils/constants';

const DROP_COUNT = 60; // Increased for more splash

export default function WaterSpray() {
  const meshRef = useRef<InstancedMesh>(null);
  const phase = useGameStore((s) => s.phase);
  const playerPos = useGameStore((s) => s.playerPosition);
  const playerForward = useGameStore((s) => s.playerForward);
  const speed = useGameStore((s) => s.speed);
  const boostUntil = useGameStore((s) => s.boostUntil);

  const dropsData = useMemo(() => {
    return Array.from({ length: DROP_COUNT }, () => ({
      life: Math.random(),
      speed: 1.0 + Math.random() * 2.0,
      lateral: (Math.random() - 0.5) * 3.0, // Wider splash
      vertical: 0.5 + Math.random() * 2.0,  // Higher splash
    }));
  }, []);

  const dummy = useMemo(() => new Object3D(), []);

  useFrame((_state, delta) => {
    if (!meshRef.current || phase !== GamePhase.Playing) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }
    
    meshRef.current.visible = true;
    const isBoosted = Date.now() < boostUntil;
    // Splash intensity scales with speed
    const intensity = isBoosted ? 2.0 : (speed / GAME.INITIAL_SPEED); 

    for (let i = 0; i < DROP_COUNT; i++) {
      const drop = dropsData[i];
      
      drop.life += delta * drop.speed * intensity;
      if (drop.life > 1) drop.life = 0;

      // Calculate splash trajectory
      const backwardOffset = playerForward.clone().multiplyScalar(-drop.life * 4 * intensity);
      
      // Cross product to get the "Right" vector for lateral splash
      const rightVec = new Vector3().crossVectors(new Vector3(0, 1, 0), playerForward).normalize();
      const lateralOffset = rightVec.multiplyScalar(drop.lateral * drop.life);
      
      // Parabolic arc for vertical splash (gravity effect)
      const gravity = drop.life * drop.life * 4; 
      const verticalOffset = new Vector3(0, (drop.vertical * drop.life * 3) - gravity, 0);

      const pos = playerPos.clone()
        .add(backwardOffset)
        .add(lateralOffset)
        .add(verticalOffset);

      dummy.position.copy(pos);
      
      // Drops stretch out as they fly
      const scale = (1 - drop.life) * 0.4 * intensity;
      dummy.scale.set(scale, scale * 1.5, scale); 
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DROP_COUNT]}>
      <sphereGeometry args={[0.2, 6, 6]} />
      <meshBasicMaterial 
        color="#ffffff" 
        transparent 
        opacity={0.8}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}