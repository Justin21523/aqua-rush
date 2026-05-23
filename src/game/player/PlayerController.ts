import { clamp } from '@/utils/math';
import { GAME } from '@/utils/constants';

/**
 * Pure (non-React) controller that turns keyboard state into a lateral
 * offset change. Kept outside the component so it's easy to unit-test
 * and to reuse for AI or replay systems later.
 */
export interface PlayerInput {
  left: boolean;
  right: boolean;
}

export function computeLateralOffset(
  currentOffset: number,
  input: PlayerInput,
  dt: number,
): number {
  let dir = 0;
  if (input.left) dir -= 1;
  if (input.right) dir += 1;

  const next = currentOffset + dir * GAME.LATERAL_SPEED * dt;
  return clamp(next, -GAME.LATERAL_LIMIT, GAME.LATERAL_LIMIT);
}