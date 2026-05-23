import { useRef } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { ENTITY } from '@/utils/constants';

export default function Booster() {
  const ref = useRef<Mesh>(null);

  useFrame((_state, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 2;
  });

  return (
    <mesh ref={ref}>
      <ringGeometry args={[ENTITY.BOOSTER_RADIUS * 0.6, ENTITY.BOOSTER_RADIUS, 24]} />
      <meshStandardMaterial 
        color="#00ffff" 
        emissive="#00ffff" 
        emissiveIntensity={0.8} 
        side={2} 
      />
    </mesh>
  );
}