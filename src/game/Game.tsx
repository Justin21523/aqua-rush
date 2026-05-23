import GameCanvas from './GameCanvas';

/**
 * Top-level game component.
 * Wraps the R3F Canvas and (in later phases) audio / global effects.
 * UI overlays live in App.tsx so they remain plain HTML/CSS.
 */
export default function Game() {
  return (
    <div className="absolute inset-0">
      <GameCanvas />
    </div>
  );
}