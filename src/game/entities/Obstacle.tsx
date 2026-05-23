import { ENTITY } from '@/utils/constants';

export default function Obstacle() {
  return (
    <mesh>
      <dodecahedronGeometry args={[ENTITY.OBSTACLE_RADIUS, 0]} />
      <meshStandardMaterial 
        color="#ff2a2a" 
        metalness={0.3} 
        roughness={0.6} 
        emissive="#550000" 
        emissiveIntensity={0.3} 
      />
    </mesh>
  );
}