import { useRef } from 'react';
import { Vector3, MathUtils } from 'three';
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
  const _backOffset = useRef(new Vector3());
  const _baseTarget = useRef(new Vector3());
  const _relativePos = useRef(new Vector3());
  const _finalTarget = useRef(new Vector3());
  const _lookTarget = useRef(new Vector3());
  const _rightVec = useRef(new Vector3());
  const _worldUp = useRef(new Vector3(0, 1, 0));

  useFrame((_state, dt) => {
    updateMouse(dt);

    // Read transform without subscribing — avoids re-rendering this component every frame
    const { playerPosition: playerPos, playerForward } = useGameStore.getState();

    // 1. Base camera target: behind and above the player
    _backOffset.current.copy(playerForward).multiplyScalar(-CAMERA.OFFSET.z);
    _baseTarget.current.set(
      playerPos.x + CAMERA.OFFSET.x + _backOffset.current.x,
      playerPos.y + CAMERA.OFFSET.y,
      playerPos.z + CAMERA.OFFSET.z + _backOffset.current.z,
    );

    // 2. Mouse orbit: yaw rotates base target around player, pitch shifts height
    const yaw = mouse.x * MathUtils.degToRad(45);
    const pitchOffset = -mouse.y * 4.0;

    _relativePos.current.copy(_baseTarget.current).sub(playerPos);
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const rotatedX = _relativePos.current.x * cosYaw - _relativePos.current.z * sinYaw;
    const rotatedZ = _relativePos.current.x * sinYaw + _relativePos.current.z * cosYaw;

    _finalTarget.current.set(
      playerPos.x + rotatedX,
      _baseTarget.current.y + pitchOffset,
      playerPos.z + rotatedZ,
    );

    // 3. Smooth position
    currentPos.current.x = smoothDamp(currentPos.current.x, _finalTarget.current.x, CAMERA.POSITION_SMOOTH, dt);
    currentPos.current.y = smoothDamp(currentPos.current.y, _finalTarget.current.y, CAMERA.POSITION_SMOOTH, dt);
    currentPos.current.z = smoothDamp(currentPos.current.z, _finalTarget.current.z, CAMERA.POSITION_SMOOTH, dt);
    camera.position.copy(currentPos.current);

    // 4. LookAt: ahead of player + mouse-X horizontal nudge to see around corners
    _lookTarget.current.copy(playerPos).addScaledVector(playerForward, CAMERA.LOOK_AHEAD);
    _rightVec.current.crossVectors(_worldUp.current, playerForward).normalize();
    _lookTarget.current.addScaledVector(_rightVec.current, mouse.x * 3);

    currentLook.current.x = smoothDamp(currentLook.current.x, _lookTarget.current.x, CAMERA.ROTATION_SMOOTH, dt);
    currentLook.current.y = smoothDamp(currentLook.current.y, _lookTarget.current.y, CAMERA.ROTATION_SMOOTH, dt);
    currentLook.current.z = smoothDamp(currentLook.current.z, _lookTarget.current.z, CAMERA.ROTATION_SMOOTH, dt);
    camera.lookAt(currentLook.current);
  });

  return null;
}
