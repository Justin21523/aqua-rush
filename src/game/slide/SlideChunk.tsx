import { useMemo, memo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Quaternion } from 'three';
import type { SlideChunkData } from '@/types/slide';
import { SLIDE } from '@/utils/constants';
import EntityWrapper from '../entities/EntityWrapper';
import { HalfTubeGeometry } from './HalfTubeGeometry';
import { useGameStore } from '@/store/gameStore';
import { ChunkShape } from '@/types/slide';
import WaterFlowMaterial from './WaterFlowMaterial';

interface SlideChunkProps {
  data: SlideChunkData;
}

const SlideChunk = memo(function SlideChunk({ data }: SlideChunkProps) {
  const groupRef = useRef<Group>(null);

  const geometry = useMemo(() => {
    return new HalfTubeGeometry(
      data.curve,
      SLIDE.TUBE_TUBULAR_SEGMENTS,
      SLIDE.TUBE_RADIUS,
      12
    );
  }, [data.curve]);

  // Pre-compute fork divider transforms (Quaternion creation is sync — no async needed)
  const dividers = useMemo(() => {
    if (data.shape !== ChunkShape.Fork) return null;

    const worldUp = new Vector3(0, 1, 0);
    const right = new Vector3();
    const localUp = new Vector3();
    const points = [];

    for (let t = 0.15; t <= 0.85; t += 0.05) {
      const p = data.curve.getPointAt(t);
      const tangent = data.curve.getTangentAt(t).normalize();
      right.crossVectors(worldUp, tangent).normalize();
      if (right.lengthSq() < 0.001) right.set(1, 0, 0);
      localUp.crossVectors(tangent, right).normalize();

      const quat = new Quaternion().setFromUnitVectors(worldUp, localUp);
      points.push({ pos: p.clone().addScaledVector(localUp.clone(), 0.5), quat: quat.clone() });
    }
    return points;
  }, [data]);

  // Release GPU memory when this chunk unmounts or geometry changes.
  // R3F does NOT auto-dispose manually-constructed BufferGeometry instances.
  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  // Cull based on chunk index. Uses getState() — NOT a React subscription —
  // so changing currentChunkIndex doesn't re-render every SlideChunk.
  useFrame(() => {
    if (groupRef.current) {
      const { currentChunkIndex } = useGameStore.getState();
      const offset = data.index - currentChunkIndex;
      groupRef.current.visible =
        offset >= -SLIDE.LOOK_BEHIND_CHUNKS && offset <= SLIDE.LOOK_AHEAD_CHUNKS;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} receiveShadow>
        <WaterFlowMaterial baseColor={data.color} />
      </mesh>

      {dividers && dividers.map((d, i) => (
        <mesh key={i} position={d.pos} quaternion={d.quat}>
          <boxGeometry args={[0.4, 1.5, 2.5]} />
          <meshStandardMaterial color="#ff4757" emissive="#ff0000" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {data.entities.map((entity) => (
        <EntityWrapper key={entity.id} chunk={data} entity={entity} />
      ))}
    </group>
  );
});

export default SlideChunk;
