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
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#bfe9ff', '#8ab4d4', 0.7]} />

      <directionalLight
        castShadow
        position={[15, 25, 10]}
        intensity={1.0}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
      />
    </>
  );
}