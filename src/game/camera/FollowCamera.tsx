import { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { CAMERA } from '@/utils/constants';
import { smoothDamp } from '@/utils/math';

/**
 * Third-person follow camera.
 *
 * It smoothly interpolates its position toward (player + OFFSET) and its
 * lookAt target toward (player + forward * LOOK_AHEAD). Smoothing uses an
 * exponential ease so motion feels natural without overshooting.
 *
 * In Phase 1 the player barely moves, so the effect is subtle; it will
 * become much more visible once the slide and forward motion kick in.
 */
export default function FollowCamera() {
  const { camera } = useThree();
  const playerPos = useGameStore((s) => s.playerPosition);

  const currentPos = useRef(new Vector3().copy(camera.position));
  const currentLook = useRef(new Vector3(0, 0, 5));

  useFrame((_state, dt) => {
    const target = new Vector3(
      playerPos.x + CAMERA.OFFSET.x,
      playerPos.y + CAMERA.OFFSET.y,
      playerPos.z + CAMERA.OFFSET.z,
    );

    currentPos.current.x = smoothDamp(currentPos.current.x, target.x, CAMERA.POSITION_SMOOTH, dt);
    currentPos.current.y = smoothDamp(currentPos.current.y, target.y, CAMERA.POSITION_SMOOTH, dt);
    currentPos.current.z = smoothDamp(currentPos.current.z, target.z, CAMERA.POSITION_SMOOTH, dt);
    camera.position.copy(currentPos.current);

    const lookTarget = new Vector3(
      playerPos.x,
      playerPos.y + 1,
      playerPos.z + CAMERA.LOOK_AHEAD,
    );
    currentLook.current.x = smoothDamp(currentLook.current.x, lookTarget.x, CAMERA.ROTATION_SMOOTH, dt);
    currentLook.current.y = smoothDamp(currentLook.current.y, lookTarget.y, CAMERA.ROTATION_SMOOTH, dt);
    currentLook.current.z = smoothDamp(currentLook.current.z, lookTarget.z, CAMERA.ROTATION_SMOOTH, dt);
    camera.lookAt(currentLook.current);
  });

  return null;
}