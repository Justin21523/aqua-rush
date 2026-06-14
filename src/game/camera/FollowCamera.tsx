import { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { CAMERA } from '@/utils/constants';
import { smoothDamp } from '@/utils/math';
import { useMouseCamera } from '@/hooks/useMouseCamera';

export default function FollowCamera() {
  const { camera } = useThree();
  const { mouse, update: updateMouse } = useMouseCamera();

  const currentPos = useRef(new Vector3().copy(camera.position));
  const currentLook = useRef(new Vector3(0, 0, 5));

  // Pre-allocated scratch vectors — zero heap allocations per frame
  const _forward = useRef(new Vector3());
  const _right = useRef(new Vector3());
  const _localUp = useRef(new Vector3());
  const _finalTarget = useRef(new Vector3());
  const _lookTarget = useRef(new Vector3());
  const _worldUp = useRef(new Vector3(0, 1, 0));

  useFrame((_state, dt) => {
    updateMouse(dt);

    // Read transform without subscribing — avoids re-rendering this component every frame
    const { playerPosition: playerPos, playerForward } = useGameStore.getState();

    _forward.current.copy(playerForward).normalize();
    if (_forward.current.lengthSq() < 0.001) {
      _forward.current.set(0, 0, 1);
    }

    _right.current.crossVectors(_worldUp.current, _forward.current).normalize();
    if (_right.current.lengthSq() < 0.001) {
      _right.current.set(1, 0, 0);
    }
    _localUp.current.crossVectors(_forward.current, _right.current).normalize();

    // 1. Base camera target follows the slide tangent, not the world Z axis.
    const sideOffset = CAMERA.OFFSET.x + mouse.x * 4.5;
    const pitchOffset = -mouse.y * 4.0;
    _finalTarget.current.copy(playerPos)
      .addScaledVector(_forward.current, CAMERA.OFFSET.z)
      .addScaledVector(_right.current, sideOffset)
      .addScaledVector(_localUp.current, CAMERA.OFFSET.y + pitchOffset);

    // 2. Smooth position
    currentPos.current.x = smoothDamp(currentPos.current.x, _finalTarget.current.x, CAMERA.POSITION_SMOOTH, dt);
    currentPos.current.y = smoothDamp(currentPos.current.y, _finalTarget.current.y, CAMERA.POSITION_SMOOTH, dt);
    currentPos.current.z = smoothDamp(currentPos.current.z, _finalTarget.current.z, CAMERA.POSITION_SMOOTH, dt);
    camera.position.copy(currentPos.current);

    // 3. Look down the same tangent as the slide, with a small side nudge.
    _lookTarget.current.copy(playerPos)
      .addScaledVector(_forward.current, CAMERA.LOOK_AHEAD)
      .addScaledVector(_localUp.current, 0.9)
      .addScaledVector(_right.current, mouse.x * 3);

    currentLook.current.x = smoothDamp(currentLook.current.x, _lookTarget.current.x, CAMERA.ROTATION_SMOOTH, dt);
    currentLook.current.y = smoothDamp(currentLook.current.y, _lookTarget.current.y, CAMERA.ROTATION_SMOOTH, dt);
    currentLook.current.z = smoothDamp(currentLook.current.z, _lookTarget.current.z, CAMERA.ROTATION_SMOOTH, dt);
    camera.up.copy(_localUp.current);
    camera.lookAt(currentLook.current);
  });

  return null;
}
