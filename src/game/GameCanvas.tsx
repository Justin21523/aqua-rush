import { Canvas } from '@react-three/fiber';
import Scene from './scene/Scene';

/**
 * R3F <Canvas> wrapper.
 *
 * We configure a few sensible defaults:
 *   - shadows for depth
 *   - a dark clear color that matches the CSS background
 *   - dpr clamped to [1, 2] so retina screens stay smooth
 *   - fov 60 for a balanced perspective
 */
export default function GameCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 60, near: 0.1, far: 500, position: [0, 5, -10] }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0b1220' }}
    >
      <Scene />
    </Canvas>
  );
}