# React Core Hooks in 3D Games

In a standard React web app, hooks like `useState` and `useEffect` are used to update the DOM. In a React Three Fiber (R3F) 3D game, we use them to update the WebGL scene. However, the rules of performance change drastically when rendering 60 frames per second.

## The Golden Rule of R3F
**Never use React state (`useState`) for values that change every frame.**
React's reconciliation (diffing the virtual DOM) is too slow for 60fps updates. If you put the player's X/Y/Z coordinates in a `useState`, React will try to re-render the entire component tree 60 times a second, causing massive lag.

Instead, we mutate Three.js objects directly using `useRef`.

---

## `useRef`: The Bridge to Three.js

`useRef` creates a mutable object that persists across renders but **does not trigger a re-render** when its `.current` value changes.

### How we use it in AquaRush:
1. **Accessing Meshes:** In `Player.tsx`, we use `useRef<Mesh>(null)` to get a direct reference to the Three.js sphere. Inside the animation loop, we modify `meshRef.current.position.x` directly. This bypasses React and talks straight to the GPU.
2. **Storing Per-Frame Data:** Variables like `lateralRef` store the player's current lateral offset. Since it changes every frame, keeping it in a `ref` prevents React from re-rendering the component.

```tsx
// BAD: Triggers React re-render 60 times a second
const [x, setX] = useState(0);
useFrame(() => setX(x + 1)); 

// GOOD: Mutates Three.js directly, zero React overhead
const meshRef = useRef<Mesh>(null);
useFrame(() => { meshRef.current.position.x += 1; });
```

---

## `useEffect`: Managing Side Effects

`useEffect` runs *after* the component renders. It is used for things that happen outside the 3D render loop, such as:
- Adding DOM event listeners (keyboard, mouse, window resize).
- Fetching data or loading external assets.
- Setting up cleanup functions when a component unmounts.

### How we use it in AquaRush:
In `App.tsx`, we use `useEffect` to listen for the `Escape` key to pause the game. We also return a cleanup function to remove the listener when the app unmounts, preventing memory leaks.

```tsx
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => { /* ... */ };
  window.addEventListener('keydown', handleKey);
  
  // Cleanup function
  return () => window.removeEventListener('keydown', handleKey);
}, [phase]); // Re-runs if 'phase' changes
```

---

## `useMemo`: Caching Expensive Calculations

`useMemo` remembers the result of a function and only recalculates it if its dependencies change. 

In 3D games, generating geometry (like a `TubeGeometry` for the slide) is mathematically expensive. We only want to calculate the vertices once when the chunk is created, not every time the component re-renders.

### How we use it in AquaRush:
In `SlideChunk.tsx`, the tube geometry is wrapped in `useMemo`. It only regenerates if `data.controlPoints` changes.

```tsx
const geometry = useMemo(() => {
  const curve = new CatmullRomCurve3(data.controlPoints);
  return new TubeGeometry(curve, 64, 2.6, 24, false);
}, [data.controlPoints]); // Only recalculates if points change
```
```

---

