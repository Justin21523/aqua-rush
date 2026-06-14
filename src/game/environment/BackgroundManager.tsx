import { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color } from 'three';
import { useGameStore } from '@/store/gameStore';
import type { SceneryItem } from '@/types/slide';

// Instance pool limits sized for the live slide chunks and their scenery chunks.
const MAX_TREES     = 900;
const MAX_TOWERS    = 300;
const MAX_SLIDES    = 420;
const MAX_CLOUDS    = 160;
const MAX_MOUNTAINS = 180;
const BACKGROUND_LOOK_AHEAD_CHUNKS = 10;
const BACKGROUND_LOOK_BEHIND_CHUNKS = 6;

// Scratch objects reused across every updateMesh call — no per-frame allocation
const _dummy = new Object3D();
const _color = new Color();
// A pre-computed "hidden" matrix (scaled to zero, far below world)
const _hiddenMatrix = (() => {
  const d = new Object3D();
  d.position.set(0, -9999, 0);
  d.scale.set(0, 0, 0);
  d.updateMatrix();
  return d.matrix;
})();

function updateMesh(
  mesh: InstancedMesh | null,
  items: SceneryItem[],
  maxCount: number,
  sx: number, sy: number, sz: number,
  rotationX = 0,
) {
  if (!mesh) return;
  const count = Math.min(items.length, maxCount);

  for (let i = 0; i < count; i++) {
    const item = items[i];
    _dummy.position.copy(item.position);
    _dummy.rotation.set(rotationX, item.rotationY, 0);
    _dummy.scale.set(item.scale * sx, item.scale * sy, item.scale * sz);
    _dummy.updateMatrix();
    mesh.setMatrixAt(i, _dummy.matrix);
    // setColorAt creates instanceColor on first call — do NOT pre-check instanceColor
    _color.set(item.colorHex);
    mesh.setColorAt(i, _color);
  }

  // Push unused slots far below the world so they are never visible
  for (let i = count; i < maxCount; i++) {
    mesh.setMatrixAt(i, _hiddenMatrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  // Required so Three.js frustum culling doesn't cull the whole InstancedMesh prematurely
  mesh.computeBoundingSphere();
}

export default function BackgroundManager() {
  const treesRef     = useRef<InstancedMesh>(null);
  const towersRef    = useRef<InstancedMesh>(null);
  const slidesRef    = useRef<InstancedMesh>(null);
  const cloudsRef    = useRef<InstancedMesh>(null);
  const mountainsRef = useRef<InstancedMesh>(null);
  const sceneryByChunkRef = useRef(new Map<number, SceneryItem[]>());
  const [pooledScenery, setPooledScenery] = useState<SceneryItem[]>([]);

  const chunks = useGameStore((s) => s.chunks);
  const currentChunkIndex = useGameStore((s) => s.currentChunkIndex);

  useEffect(() => {
    const sceneryByChunk = sceneryByChunkRef.current;

    if (chunks.length === 0) {
      sceneryByChunk.clear();
      setPooledScenery([]);
      return;
    }

    let changed = false;
    for (const chunk of chunks) {
      if (chunk.scenery.length === 0 || sceneryByChunk.has(chunk.index)) continue;
      sceneryByChunk.set(chunk.index, chunk.scenery);
      changed = true;
    }

    const minIndex = currentChunkIndex - BACKGROUND_LOOK_BEHIND_CHUNKS;
    const maxIndex = currentChunkIndex + BACKGROUND_LOOK_AHEAD_CHUNKS;
    for (const index of sceneryByChunk.keys()) {
      if (index < minIndex || index > maxIndex) {
        sceneryByChunk.delete(index);
        changed = true;
      }
    }

    if (changed) {
      setPooledScenery(
        [...sceneryByChunk.entries()]
          .sort(([a], [b]) => a - b)
          .flatMap(([, scenery]) => scenery)
      );
    }
  }, [chunks, currentChunkIndex]);

  const { trees, towers, slides, clouds, mountains } = useMemo(() => {
    const cat = {
      trees:     [] as SceneryItem[],
      towers:    [] as SceneryItem[],
      slides:    [] as SceneryItem[],
      clouds:    [] as SceneryItem[],
      mountains: [] as SceneryItem[],
    };
    for (const item of pooledScenery) {
      if (item.type === 'tree') cat.trees.push(item);
      else if (item.type === 'tower')    cat.towers.push(item);
      else if (item.type === 'bg-slide') cat.slides.push(item);
      else if (item.type === 'cloud')    cat.clouds.push(item);
      else if (item.type === 'mountain') cat.mountains.push(item);
    }
    return cat;
  }, [pooledScenery]);

  // Rebuild instance matrices whenever the set of active scenery changes
  useEffect(() => {
    updateMesh(treesRef.current,     trees,     MAX_TREES,     1.5, 3.0, 1.5);
    updateMesh(towersRef.current,    towers,    MAX_TOWERS,    2.0, 5.0, 2.0);
    updateMesh(slidesRef.current,    slides,    MAX_SLIDES,    1.2, 18.0, 1.2, Math.PI / 2);
    updateMesh(cloudsRef.current,    clouds,    MAX_CLOUDS,    3.0, 1.5, 2.0);
    updateMesh(mountainsRef.current, mountains, MAX_MOUNTAINS, 10.0, 10.0, 10.0);
  }, [trees, towers, slides, clouds, mountains]);

  // Gentle local cloud drift. Keep it bounded so scenery never walks away.
  const cloudDrift = useRef(0);
  useFrame((_state, dt) => {
    cloudDrift.current += dt * 0.35;
    if (cloudsRef.current) {
      cloudsRef.current.position.x = Math.sin(cloudDrift.current) * 8;
    }
  });

  return (
    <group>
      {/* Near layer: trees */}
      <instancedMesh ref={treesRef} args={[undefined, undefined, MAX_TREES]} frustumCulled={false}>
        <coneGeometry args={[1, 2, 6]} />
        <meshStandardMaterial vertexColors />
      </instancedMesh>

      {/* Mid layer: towers */}
      <instancedMesh ref={towersRef} args={[undefined, undefined, MAX_TOWERS]} frustumCulled={false}>
        <cylinderGeometry args={[0.8, 1.2, 2, 8]} />
        <meshStandardMaterial vertexColors />
      </instancedMesh>

      {/* Mid layer: decorative background slides */}
      <instancedMesh ref={slidesRef} args={[undefined, undefined, MAX_SLIDES]} frustumCulled={false}>
        <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
        <meshStandardMaterial vertexColors transparent opacity={0.5} depthWrite={false} />
      </instancedMesh>

      {/* Sky layer: clouds */}
      <instancedMesh ref={cloudsRef} args={[undefined, undefined, MAX_CLOUDS]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.85} depthWrite={false} />
      </instancedMesh>

      {/* Far layer: mountains */}
      <instancedMesh ref={mountainsRef} args={[undefined, undefined, MAX_MOUNTAINS]} frustumCulled={false}>
        <coneGeometry args={[1, 1.5, 5]} />
        <meshStandardMaterial vertexColors transparent opacity={0.65} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
