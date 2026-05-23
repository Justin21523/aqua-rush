import Lighting from './Lighting';
import Player from '../player/Player';
import FollowCamera from '../camera/FollowCamera';

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
  return (
    <>
      <Lighting />
      <FollowCamera />

      <mesh rotation-x={-Math.PI / 2} position={[0, -2, 20]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0a2a3a" />
      </mesh>

      <Player />
    </>
  );
}