import { useEffect, useRef } from 'react';

/**
 * Tracks mouse movement to control camera orbit.
 * Returns normalized values (-1 to 1) representing the desired camera offset.
 */
export function useMouseCamera() {
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      // Normalize screen coordinates to -1 ... 1
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  // Smoothly interpolate current mouse value towards target
  const update = (dt: number) => {
    const smooth = 1 - Math.exp(-5 * dt);
    mouse.current.x += (target.current.x - mouse.current.x) * smooth;
    mouse.current.y += (target.current.y - mouse.current.y) * smooth;
  };

  return { mouse: mouse.current, update };
}