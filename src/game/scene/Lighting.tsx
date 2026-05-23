/**
 * Scene lighting rig.
 *
 * Combines:
 *   - a soft ambient for base illumination
 *   - a hemisphere light for sky/ground color contrast
 *   - a directional "sun" that casts shadows
 */
export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#bfe9ff', '#1a2a44', 0.6]} />

      <directionalLight
        castShadow
        position={[15, 25, 10]}
        intensity={1.1}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
      />
    </>
  );
}