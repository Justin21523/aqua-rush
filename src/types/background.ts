import type { Vector3 } from 'three';

export type SceneryType = 'tree' | 'palm' | 'tower' | 'bg-slide' | 'cloud' | 'mountain';

export interface SceneryItem {
  id: string;
  type: SceneryType;
  position: Vector3;
  scale: number;
  rotationY: number;
  colorHex: string;
}

export interface BackgroundChunkData {
  id: string;
  index: number;
  zStart: number;
  zEnd: number;
  scenery: SceneryItem[];
}