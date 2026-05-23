import { useMemo } from 'react';
import { TubeGeometry, CatmullRomCurve3 } from 'three';
import type { SlideChunkData } from '@/types/slide';
import { SLIDE } from '@/utils/constants';

/**
 * Renders a single chunk of the waterslide as a tube along its spline.
 *
 * The tube is open-ended (so the ball can enter/exit) and uses a slightly
 * transparent material so the player remains visible inside.
 */
interface SlideChunkProps {
  data: SlideChunkData;
}

export default function SlideChunk({ data }: SlideChunkProps) {
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(data.controlPoints, false, 'centripetal', 0.5);
    return new TubeGeometry(
      curve,
      SLIDE.TUBE_TUBULAR_SEGMENTS,
      SLIDE.TUBE_RADIUS,
      SLIDE.TUBE_RADIAL_SEGMENTS,
      false,
    );
  }, [data.controlPoints]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={data.color}
        metalness={0.1}
        roughness={0.4}
        transparent
        opacity={0.85}
        side={2} // DoubleSide so the inside of the tube is visible.
      />
    </mesh>
  );
}