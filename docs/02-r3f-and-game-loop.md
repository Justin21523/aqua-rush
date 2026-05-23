# React Three Fiber Hooks & The Game Loop

React Three Fiber (R3F) provides special hooks that connect React's component lifecycle to Three.js's rendering engine. These are the tools that make the game actually "move".

---

## `useFrame`: The Heartbeat of the Game

`useFrame` is R3F's equivalent of `requestAnimationFrame`. The callback you pass to it runs exactly once per rendered frame (usually 60 times a second).

### Signature:
```tsx
useFrame((state, delta) => { ... })
```

- **`state`**: Contains the Three.js `scene`, `camera`, `clock`, and mouse pointer data.
- **`delta`**: The time in seconds since the last frame. **Always use `delta` for movement.** If you just add `1` to a position every frame, the game will run faster on 144Hz monitors and slower on 30Hz laptops. Multiplying by `delta` ensures consistent speed across all devices.

### How we use it in AquaRush:
In `Player.tsx`, `useFrame` reads the keyboard input, calculates the new lateral position, and applies it to the mesh.

```tsx
useFrame((_state, delta) => {
  // delta ensures movement is framerate-independent
  lateralRef.current = computeLateralOffset(lateralRef.current, input, delta);
  mesh.position.x = lateralRef.current;
});
```

**Crucial Rule:** Never call React hooks (like `useState` or `useEffect`) inside `useFrame`. It violates the Rules of Hooks and will crash your app.

---

## `useThree`: Accessing the Engine

`useThree` gives you access to the core Three.js objects that R3F manages under the hood. 

### Common properties:
- `camera`: The active Three.js camera.
- `scene`: The root Three.js scene.
- `gl`: The WebGL renderer.
- `size`: The current width/height of the canvas.

### How we use it in AquaRush:
In `FollowCamera.tsx`, we need to move the actual camera that is rendering the scene. We pull it out using `useThree` and manipulate its `position` and `lookAt` vectors inside `useFrame`.

```tsx
const { camera } = useThree();

useFrame((_state, dt) => {
  // Smoothly move the Three.js camera
  camera.position.lerp(targetPosition, dt * smoothFactor);
  camera.lookAt(targetLookAt);
});
```

---

## The Game Loop Architecture

In traditional game engines (Unity, Unreal), there is a central `Update()` loop. In R3F, the "loop" is decentralized: every component that uses `useFrame` gets its own slice of the update cycle.

**Execution Order per Frame:**
1. React Three Fiber triggers the frame.
2. All `useFrame` callbacks run (order depends on component tree depth).
3. Physics/Collisions are calculated.
4. Three.js renders the scene to the canvas.

To keep things organized, we created a custom `useGameLoop` hook (explained in Doc 4) to act as a central gatekeeper, ensuring systems only update when the game is actually in the `Playing` phase.
```

---

