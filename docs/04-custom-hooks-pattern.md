# Custom Hooks Patterns

Custom hooks allow us to extract complex, reusable logic out of our UI and Scene components. In AquaRush, we use them to encapsulate input handling and the game loop lifecycle.

---

## `useKeyboard`: Tracking Input without Re-renders

A naive approach to keyboard input in React is to use `useState`:
```tsx
// BAD for games
const [isLeft, setIsLeft] = useState(false);
```
This causes a React re-render every time the user taps a key. If the user mashes 'A' and 'D', the app will stutter.

### The `useRef` + `useEffect` Pattern
In `src/hooks/useKeyboard.ts`, we combine `useEffect` (to attach DOM listeners) with `useRef` (to store the key states mutably).

```tsx
export function useKeyboard() {
  const keys = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  return keys;
}
```

**How to use it in `useFrame`:**
```tsx
const keys = useKeyboard();

useFrame(() => {
  // Read the ref directly. No re-renders triggered!
  if (keys.current['ArrowLeft']) {
    // move left
  }
});
```

---

## `useGameLoop`: The Central Gatekeeper

In a real game, you have many systems updating every frame (physics, AI, animations). If the player pauses the game, you want all of these to stop.

Instead of putting `if (phase !== Playing)` inside every single `useFrame` block, we created `useGameLoop` in `src/hooks/useGameLoop.ts`.

```tsx
export function useGameLoop(updater: (dt: number) => void) {
  const phase = useGameStore((s) => s.phase);

  useFrame((_state, delta) => {
    // Gatekeeper: Only run if playing
    if (phase !== GamePhase.Playing) return;
    
    // Cap delta to prevent physics explosions after tab-switching
    const dt = Math.min(delta, 1 / 30);
    
    updater(dt);
  });
}
```

### Usage in a Component:
```tsx
function PlayerPhysics() {
  useGameLoop((dt) => {
    // This code ONLY runs when phase === Playing.
    // dt is safely capped.
    applyGravity(dt);
    checkCollisions();
  });
  
  return <mesh />;
}
```

This pattern keeps individual components clean and ensures global game rules (like pausing) are enforced universally.
```

---
