import Lighting from './Lighting';
import Player from '../player/Player';
import FollowCamera from '../camera/FollowCamera';
import CameraEffects from '../camera/CameraEffects';
import SlideManager from '../slide/SlideManager';
import SlideChunk from '../slide/SlideChunk';
import { useGameStore } from '@/store/gameStore';
import { Sky } from '@react-three/drei';
import WaterSpray from '../effects/WaterSpray';
import BackgroundManager from '../environment/BackgroundManager';

/**
 * The 3D scene. Everything inside <Canvas> lives here.
 *
 * Phase 1 composition:
 *   - Lighting rig
 *   - Reference ground (will be removed once the slide takes over)
 *   - Player ball
 *   - Smooth follow camera
 */
export default function Scene() {
  const chunks = useGameStore((s) => s.chunks);

  return (
    <>
      <Lighting />
      <FollowCamera />
      <CameraEffects /> {/* Handles FOV changes */}

      {/* Soft light-blue sky color instead of heavy Sky shader */}
      <color attach="background" args={['#b3e0ff']} />

      {/* 🌟 Infinite Procedural Background */}
      <BackgroundManager />
      
      {/* Sky and atmosphere */}
      <Sky 
        sunPosition={[100, 20, 100]} 
        turbidity={10} 
        rayleigh={2} 
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      <SlideManager />

      {chunks.map((chunk) => (
        <SlideChunk key={chunk.id} data={chunk} />
      ))}

      <Player />
      <WaterSpray /> {/* Add here */}

      <fog attach="fog" args={['#87ceeb', 60, 180]} /> {/* Match sky color */}
    </>
  );
}