import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { useGameStore, GamePhase } from '@/store/gameStore';
import { smoothDamp } from '@/utils/math';

export default function CameraEffects() {
  const { camera } = useThree();
  const boostUntil = useGameStore((s) => s.boostUntil);
  const phase = useGameStore((s) => s.phase);
  
  const currentFov = useRef(60);
  const shakeIntensity = useRef(0);
  
  useFrame((_state, dt) => {
    // 1. FOV Boost Effect
    const isBoosted = Date.now() < boostUntil;
    const targetFov = isBoosted ? 75 : 60;
    currentFov.current = smoothDamp(currentFov.current, targetFov, 5, dt);
    
    if (camera instanceof PerspectiveCamera) {
      camera.fov = currentFov.current;
      camera.updateProjectionMatrix();
    }

    // 2. Camera Shake on Game Over
    if (phase === GamePhase.GameOver) {
      shakeIntensity.current = 1.5; // Trigger shake
    }

    if (shakeIntensity.current > 0.01) {
      // Apply random offset
      const shakeX = (Math.random() - 0.5) * shakeIntensity.current;
      const shakeY = (Math.random() - 0.5) * shakeIntensity.current;
      
      camera.position.x += shakeX;
      camera.position.y += shakeY;
      
      // Decay shake
      shakeIntensity.current *= 0.9; 
    }
  });

  return null;
}