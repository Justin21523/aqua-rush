import { useMemo, memo } from 'react';
import type { SlideChunkData, ChunkEntity } from '@/types/slide';
import { getEntityTransform } from '@/utils/curves';
import Coin from './Coin';
import Obstacle from './Obstacle';
import Booster from './Booster';

interface EntityWrapperProps {
  chunk: SlideChunkData;
  entity: ChunkEntity;
}

/**
 * Renders a single entity (coin/obstacle/booster) at its curve position.
 *
 * PERFORMANCE NOTE:
 * - We use React.memo to prevent re-renders unless entity.collected changes.
 * - We deliberately do NOT subscribe to playerPosition here.
 * - Visibility culling is handled at the SlideChunk level based on chunk index.
 */
const EntityWrapper = memo(function EntityWrapper({ chunk, entity }: EntityWrapperProps) {
  const transform = useMemo(
    () => getEntityTransform(chunk.curve, entity.t, entity.lane),
    [chunk.curve, entity.t, entity.lane]
  );

  if (entity.collected) return null;

  return (
    <group position={transform.position} quaternion={transform.quaternion}>
      {entity.kind === 'coin' && <Coin />}
      {entity.kind === 'obstacle' && <Obstacle />}
      {entity.kind === 'booster' && <Booster />}
    </group>
  );
});

export default EntityWrapper;