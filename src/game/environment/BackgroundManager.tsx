import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color, Vector3 } from 'three';
import { useGameStore } from '@/store/gameStore';
import type { SceneryItem } from '@/types/slide';

// Max instances allocated for each type (plenty for visible chunks)
// Increased limits for multi-layered scenery
const MAX_TREES = 500;
const MAX_TOWERS = 120;
const MAX_SLIDES = 100;
const MAX_CLOUDS = 80;
const MAX_MOUNTAINS = 60;

export default function BackgroundManager() {
  const chunks = useGameStore((s) => s.chunks);
  
  const treesRef = useRef<InstancedMesh>(null);
  const towersRef = useRef<InstancedMesh>(null);
  const slidesRef = useRef<InstancedMesh>(null);
  const cloudsRef = useRef<InstancedMesh>(null);
  const mountainsRef = useRef<InstancedMesh>(null);

  // 1. Collect all scenery from active chunks
  const allScenery = useMemo(() => {
    return chunks.flatMap((chunk) => chunk.scenery);
  }, [chunks]);

  // 2. Categorize scenery
  const { trees, towers, slides, clouds, mountains } = useMemo(() => {
    const cat = {
      trees: [] as SceneryItem[],
      towers: [] as SceneryItem[],
      slides: [] as SceneryItem[],
      clouds: [] as SceneryItem[],
      mountains: [] as SceneryItem[],
    };
    for (const item of allScenery) {
      if (item.type === 'tree') cat.trees.push(item);
      else if (item.type === 'tower') cat.towers.push(item);
      else if (item.type === 'bg-slide') cat.slides.push(item);
      else if (item.type === 'cloud') cat.clouds.push(item);
      else if (item.type === 'mountain') cat.mountains.push(item);
    }
    return cat;
  }, [allScenery]);

  // 3. Update InstancedMesh matrices when scenery changes
  useEffect(() => {
    const dummy = new Object3D();
    const color = new Color();

    const updateMesh = (
      ref: React.RefObject<InstancedMesh>, 
      items: SceneryItem[], 
      maxCount: number,
      baseGeometryScale: Vector3 = new Vector3(1,1,1)
    ) => {
      if (!ref.current) return;
      
      const count = Math.min(items.length, maxCount);
      
      for (let i = 0; i < count; i++) {
        const item = items[i];
        dummy.position.copy(item.position);
        dummy.rotation.set(0, item.rotationY, 0);
        dummy.scale.set(
          item.scale * baseGeometryScale.x, 
          item.scale * baseGeometryScale.y, 
          item.scale * baseGeometryScale.z
        );
        dummy.updateMatrix();
        ref.current.setMatrixAt(i, dummy.matrix);
        
        if (ref.current.instanceColor) {
          color.set(item.colorHex);
          ref.current.setColorAt(i, color);
        }
      }
      
      // Hide unused instances by scaling them to 0
      for (let i = count; i < maxCount; i++) {
        dummy.position.set(0, -1000, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        ref.current.setMatrixAt(i, dummy.matrix);
      }

      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
      ref.current.computeBoundingSphere();
    };

    updateMesh(treesRef, trees, MAX_TREES, new Vector3(1.5, 3, 1.5));
    updateMesh(towersRef, towers, MAX_TOWERS, new Vector3(2, 5, 2));
    updateMesh(slidesRef, slides, MAX_SLIDES, new Vector3(2, 2, 15)); // Long tubes
    updateMesh(cloudsRef, clouds, MAX_CLOUDS, new Vector3(3, 1.5, 2));
    updateMesh(mountainsRef, mountains, MAX_MOUNTAINS, new Vector3(10, 10, 10));
  }, [trees, towers, slides, clouds, mountains]);

  // 4. Gentle cloud animation
  useFrame((_state, dt) => {
    if (cloudsRef.current) {
      // Slowly drift clouds (very cheap operation)
      cloudsRef.current.rotation.y += dt * 0.002; 
    }
  });

  return (
    <group renderOrder={-1000}>
      <instancedMesh ref={treesRef} args={[undefined, undefined, MAX_TREES]} castShadow={false} receiveShadow={false}>
        <coneGeometry args={[1, 2, 6]} />
        <meshStandardMaterial vertexColors />
      </instancedMesh>

      <instancedMesh ref={towersRef} args={[undefined, undefined, MAX_TOWERS]} castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[0.8, 1.2, 2, 8]} />
        <meshStandardMaterial vertexColors />
      </instancedMesh>

      <instancedMesh ref={slidesRef} args={[undefined, undefined, MAX_SLIDES]} castShadow={false} receiveShadow={false}>
        <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
        <meshStandardMaterial vertexColors transparent opacity={0.45} depthWrite={false} />
      </instancedMesh>

      <instancedMesh ref={cloudsRef} args={[undefined, undefined, MAX_CLOUDS]} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.85} depthWrite={false} />
      </instancedMesh>

      {/* Mountains - large, distant, semi-transparent for atmospheric depth */}
      <instancedMesh ref={mountainsRef} args={[undefined, undefined, MAX_MOUNTAINS]} castShadow={false} receiveShadow={false}>
        <coneGeometry args={[1, 1.5, 5]} />
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}