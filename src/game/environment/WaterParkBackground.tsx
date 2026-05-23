import { useMemo, useRef } from 'react';
import { CatmullRomCurve3, Vector3, TubeGeometry, InstancedMesh, Object3D, Color } from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Decorative water park background.
 * Uses InstancedMesh for trees and clouds to keep draw calls minimal.
 * All elements are static and don't interact with gameplay.
 */
export default function WaterParkBackground() {
  const treesRef = useRef<InstancedMesh>(null);
  const cloudsRef = useRef<InstancedMesh>(null);

  // Generate background decorative slides
  const backgroundSlides = useMemo(() => {
    const slides = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = 80 + Math.random() * 40;
      const height = 10 + Math.random() * 40;

      const start = new Vector3(
        Math.cos(angle) * distance,
        height,
        Math.sin(angle) * distance
      );

      const end = new Vector3(
        Math.cos(angle + 0.3) * (distance + 20),
        height - 30 - Math.random() * 20,
        Math.sin(angle + 0.3) * (distance + 20)
      );

      const mid = new Vector3()
        .lerpVectors(start, end, 0.5)
        .add(new Vector3((Math.random() - 0.5) * 30, 15, (Math.random() - 0.5) * 30));

      const curve = new CatmullRomCurve3([start, mid, end]);
      const geometry = new TubeGeometry(curve, 24, 2.5, 8, false);

      slides.push({
        geometry,
        color: ['#ff6b9d', '#feca57', '#48dbfb', '#1dd1a1', '#b181ff', '#ff9ff3'][i % 6],
        key: `slide-${i}`,
      });
    }
    return slides;
  }, []);

  // Generate tree instance matrices
  const treeCount = 60;
  const treeData = useMemo(() => {
    const dummy = new Object3D();
    const matrices: Float32Array = new Float32Array(treeCount * 16);
    const colors: Float32Array = new Float32Array(treeCount * 3);
    
    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 80;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const scale = 1.5 + Math.random() * 2;

      dummy.position.set(x, -5 + scale * 2, z);
      dummy.scale.set(scale, scale * (1 + Math.random()), scale);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();
      dummy.matrix.toArray(matrices, i * 16);

      // Vary tree color
      const color = new Color().setHSL(0.3 + Math.random() * 0.1, 0.6, 0.3 + Math.random() * 0.2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    return { matrices, colors };
  }, []);

  // Generate cloud instance matrices
  const cloudCount = 25;
  const cloudData = useMemo(() => {
    const dummy = new Object3D();
    const matrices: Float32Array = new Float32Array(cloudCount * 16);

    for (let i = 0; i < cloudCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = 50 + Math.random() * 40;

      dummy.position.set(x, y, z);
      dummy.scale.set(
        8 + Math.random() * 8,
        3 + Math.random() * 2,
        6 + Math.random() * 5
      );
      dummy.updateMatrix();
      dummy.matrix.toArray(matrices, i * 16);
    }
    return matrices;
  }, []);

  // Apply instance matrices once
  useMemo(() => {
    if (treesRef.current) {
      const dummy = new Object3D();
      const matrix = dummy.matrix;
      for (let i = 0; i < treeCount; i++) {
        matrix.fromArray(treeData.matrices, i * 16);
        treesRef.current.setMatrixAt(i, matrix);
        
        const color = new Color(
          treeData.colors[i * 3],
          treeData.colors[i * 3 + 1],
          treeData.colors[i * 3 + 2]
        );
        treesRef.current.setColorAt(i, color);
      }
      treesRef.current.instanceMatrix.needsUpdate = true;
      if (treesRef.current.instanceColor) {
        treesRef.current.instanceColor.needsUpdate = true;
      }
    }

    if (cloudsRef.current) {
      const dummy = new Object3D();
      const matrix = dummy.matrix;
      for (let i = 0; i < cloudCount; i++) {
        matrix.fromArray(cloudData, i * 16);
        cloudsRef.current.setMatrixAt(i, matrix);
      }
      cloudsRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [treeData, cloudData]);

  // Gentle cloud drift animation (low-cost)
  useFrame((_state, dt) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += dt * 0.005;
    }
  });

  return (
    // FIX 1: renderOrder={-1000} forces this entire group to render FIRST (behind everything).
    <group renderOrder={-1000}>
      {/* Distant decorative slides */}
      {backgroundSlides.map((slide) => (
        <mesh key={slide.key} geometry={slide.geometry}>
          <meshStandardMaterial
            color={slide.color}
            transparent
            opacity={0.45}
            metalness={0.1}
            roughness={0.6}
            depthWrite={false} // FIX 2: Prevents transparent tubes from blocking depth buffer
          />
        </mesh>
      ))}

      {/* Water pool below */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -15, 0]}>
        <circleGeometry args={[200, 32]} />
        <meshStandardMaterial
          color="#4fa8d1"
          metalness={0.3}
          roughness={0.1}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>

      {/* Trees using InstancedMesh (60 trees, 1 draw call) */}
      <instancedMesh
        ref={treesRef}
        args={[undefined, undefined, treeCount]}
        castShadow={false}
        receiveShadow={false}
      >
        <coneGeometry args={[1.5, 4, 6]} />
        <meshStandardMaterial vertexColors />
      </instancedMesh>

      {/* Tree trunks (another instanced mesh) */}
      <instancedMesh
        args={[undefined, undefined, treeCount]}
        castShadow={false}
        receiveShadow={false}
      >
        <cylinderGeometry args={[0.3, 0.4, 2, 6]} />
        <meshStandardMaterial color="#6b4226" />
        {useMemo(() => {
          // Apply trunk matrices (offset Y from tree crowns)
          const arr: JSX.Element[] = [];
          return arr;
        }, [])}
      </instancedMesh>

      {/* Clouds using InstancedMesh (25 clouds, 1 draw call) */}
      <instancedMesh
        ref={cloudsRef}
        args={[undefined, undefined, cloudCount]}
        castShadow={false}
        receiveShadow={false}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.85}
          emissive="#ffffff"
          emissiveIntensity={0.1}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Tower structures (water park theme) */}
      <group position={[40, 0, -60]}>
        <mesh position={[0, 15, 0]}>
          <cylinderGeometry args={[3, 4, 30, 8]} />
          <meshStandardMaterial color="#ff9a8b" />
        </mesh>
        <mesh position={[0, 32, 0]}>
          <coneGeometry args={[5, 4, 8]} />
          <meshStandardMaterial color="#ff6b9d" />
        </mesh>
      </group>

      <group position={[-50, 0, -70]}>
        <mesh position={[0, 20, 0]}>
          <cylinderGeometry args={[3.5, 4.5, 40, 8]} />
          <meshStandardMaterial color="#a0e7e5" />
        </mesh>
        <mesh position={[0, 42, 0]}>
          <coneGeometry args={[6, 5, 8]} />
          <meshStandardMaterial color="#48dbfb" />
        </mesh>
      </group>

      <group position={[70, 0, 40]}>
        <mesh position={[0, 12, 0]}>
          <cylinderGeometry args={[2.5, 3.5, 24, 8]} />
          <meshStandardMaterial color="#feca57" />
        </mesh>
        <mesh position={[0, 26, 0]}>
          <coneGeometry args={[4.5, 3.5, 8]} />
          <meshStandardMaterial color="#ffae00" />
        </mesh>
      </group>

      {/* Distant hills/mountains */}
      <mesh position={[0, -10, -180]}>
        <coneGeometry args={[80, 60, 6]} />
        <meshStandardMaterial color="#7ba4c9" transparent opacity={0.6} depthWrite={false} />
      </mesh>
      <mesh position={[-120, -15, -160]}>
        <coneGeometry args={[60, 50, 5]} />
        <meshStandardMaterial color="#8cb4d4" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[140, -12, -170]}>
        <coneGeometry args={[70, 55, 5]} />
        <meshStandardMaterial color="#85adc9" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}