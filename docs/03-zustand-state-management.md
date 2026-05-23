# State Management with Zustand

Managing state in a 3D game requires a delicate balance. We need global state for the UI (score, menus), but we must avoid triggering React re-renders for high-frequency 3D updates.

## Why not `useState` or React Context?

1. **`useState`**: Only works inside a single component. Passing score down through 10 layers of components (prop drilling) is messy.
2. **React Context**: When a Context value changes, **every** component consuming that context re-renders. If we put the player's exact 3D coordinates in Context, the entire UI and scene would re-render 60 times a second, destroying performance.

## Enter Zustand

Zustand is a lightweight, fast state management library. Its superpower is **selectors**: components only re-render if the *specific slice* of state they selected changes.

---

## Creating the Store

In `src/store/gameStore.ts`, we use `create` to define a global store.

```tsx
export const useGameStore = create<GameState>((set, get) => ({
  phase: GamePhase.Menu,
  score: 0,
  
  // Actions to modify state
  addScore: (points) => set((state) => ({ score: state.score + points })),
  
  startRun: () => set({ phase: GamePhase.Playing, score: 0 }),
}));
```

- **`set`**: Merges new values into the store.
- **`get`**: Reads the current state (useful when an action depends on current values, like checking for a high score).

---

## Using Selectors for Performance

When consuming the store in a component, we pass a selector function.

```tsx
// In HUD.tsx
const score = useGameStore((state) => state.score);
```

**Why this is brilliant:**
The `HUD` component will **only** re-render when `score` changes. If the `phase` changes, or if the `playerPosition` updates, the `HUD` ignores it. This granular subscription is what makes Zustand perfect for games.

### Anti-Pattern to Avoid:
```tsx
// BAD: Subscribes to the ENTIRE store. Re-renders on ANY change.
const store = useGameStore(); 
```

---

## Bridging 3D and UI

Notice how `playerPosition` is in the Zustand store, but we don't update it 60 times a second. 
- The `Player.tsx` component uses `useRef` for its actual 3D movement (high frequency).
- It only updates the Zustand `playerPosition` occasionally (or we use it just for the camera to read without needing a direct prop). 
This separation keeps the React UI tree completely isolated from the WebGL render loop's high-frequency math.
```

---
