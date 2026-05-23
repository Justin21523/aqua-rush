import { Vector3, MathUtils } from 'three';
import type { BackgroundChunkData, SceneryItem, SceneryType } from '@/types/background';
import { pickRandom, shortId, chance } from '@/utils/math';

const COLORS = {
  tower: ['#ff9a8b', '#a0e7e5', '#feca57', '#b181ff', '#ff6b9d'],
  slide: ['#ff6b9d', '#feca57', '#48dbfb', '#1dd1a1', '#b181ff', '#ff9ff3'],
  mountain: ['#7ba4c9', '#8cb4d4', '#85adc9', '#9bc0de', '#6e97b8'],
};

export class BackgroundGenerator {
  private nextIndex = 0;
  private cursorZ = 0;

  reset() {
    this.nextIndex = 0;
    this.cursorZ = 0;
  }

  generateNext(chunkLength: number): BackgroundChunkData {
    const index = this.nextIndex++;
    const zStart = this.cursorZ;
    const zEnd = this.cursorZ + chunkLength;
    this.cursorZ = zEnd;

    return {
      id: shortId('bg'),
      index,
      zStart,
      zEnd,
      scenery: this.populateScenery(zStart, zEnd, chunkLength),
    };
  }

  private populateScenery(zStart: number, zEnd: number, length: number): SceneryItem[] {
    const items: SceneryItem[] = [];
    const clusters = Math.floor(length / 15) + 2;

    for (let i = 0; i < clusters; i++) {
      const t = (i + 0.5) / clusters;
      const z = MathUtils.lerp(zStart, zEnd, t);

      // Layer 1: Near (dense foliage)
      this.spawnLayer(items, z, 15, 50, ['tree', 'palm', 'tree', 'tower'], 1.0, 3.0, -5, 0.1);
      // Layer 2: Mid (water park structures)
      this.spawnLayer(items, z, 60, 140, ['tower', 'bg-slide', 'bg-slide', 'tree'], 3.0, 7.0, 0, 0.15);
      // Layer 3: Far (mountains & horizon)
      this.spawnLayer(items, z, 160, 300, ['mountain', 'mountain', 'bg-slide'], 8.0, 18.0, -10, 0.2);
    }

    // Sky layer: clouds
    for (let i = 0; i < 3; i++) {
      if (!chance(0.6)) continue;
      const z = zStart + Math.random() * length;
      const x = (Math.random() - 0.5) * 350;
      items.push({
        id: shortId('sc'),
        type: 'cloud',
        position: new Vector3(x, 50 + Math.random() * 40, z),
        scale: 5 + Math.random() * 10,
        rotationY: Math.random() * Math.PI * 2,
        colorHex: '#ffffff',
      });
    }

    return items;
  }

  private spawnLayer(
    items: SceneryItem[],
    z: number,
    distMin: number,
    distMax: number,
    types: SceneryType[],
    scaleMin: number,
    scaleMax: number,
    yBase: number,
    skipChance: number
  ) {
    for (let side = -1; side <= 1; side += 2) {
      if (chance(skipChance)) continue;
      const dist = distMin + Math.random() * (distMax - distMin);
      const x = side * dist;
      const type = pickRandom(types) || 'tree';
      const scale = scaleMin + Math.random() * (scaleMax - scaleMin);

      let colorHex = '#2d5a27';
      if (type === 'tower') colorHex = pickRandom(COLORS.tower) || '#ff9a8b';
      else if (type === 'bg-slide') colorHex = pickRandom(COLORS.slide) || '#48dbfb';
      else if (type === 'mountain') colorHex = pickRandom(COLORS.mountain) || '#7ba4c9';
      else if (type === 'palm') colorHex = `hsl(${85 + Math.random() * 30}, ${35 + Math.random() * 25}%, ${30 + Math.random() * 20}%)`;
      else if (type === 'tree') colorHex = `hsl(${95 + Math.random() * 45}, ${40 + Math.random() * 35}%, ${20 + Math.random() * 25}%)`;

      items.push({
        id: shortId('sc'),
        type,
        position: new Vector3(x, yBase + Math.random() * 4, z),
        scale,
        rotationY: Math.random() * Math.PI * 2,
        colorHex,
      });
    }
  }
}