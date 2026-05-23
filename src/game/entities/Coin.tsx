import { useRef } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { ENTITY } from '@/utils/constants';

export default function Coin() {
  const ref = useRef<Mesh>(null);

  useFrame((_state, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 4;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[ENTITY.COIN_RADIUS, ENTITY.COIN_RADIUS * 0.3, 12, 20]} />
      <meshStandardMaterial 
        color="#ffd700" 
        metalness={0.8} 
        roughness={0.2} 
        emissive="#ffaa00" 
        emissiveIntensity={0.4} 
      />
    </mesh>
  );
}