import { useEffect } from 'react';
import Game from '@/game/Game';
import MainMenu from '@/ui/MainMenu';
import GameOverMenu from '@/ui/GameOverMenu';
import PauseMenu from '@/ui/PauseMenu';
import DebugPanel from '@/ui/DebugPanel'; 
import HUD from '@/ui/HUD';
import { useGameStore, GamePhase } from '@/store/gameStore';

/**
 * Root component.
 * Renders the 3D game world at all times, and overlays different UI
 * screens depending on the current game phase (menu / playing / paused / gameover).
 */
export default function App() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const toggleGodMode = useGameStore((s) => s.toggleGodMode);

  // Global Escape handler toggles pause while playing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (phase === GamePhase.Playing) setPhase(GamePhase.Paused);
        else if (phase === GamePhase.Paused) setPhase(GamePhase.Playing);
      }
      // Toggle God Mode with 'G' or 'g'
      if (e.key === 'g' || e.key === 'G') {
        toggleGodMode();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, setPhase, toggleGodMode]);

  return (
    <div className="relative h-full w-full">
      <Game />

      {phase === GamePhase.Menu && <MainMenu />}
      {phase === GamePhase.Playing && (
        <>
          <HUD />
          <DebugPanel /> 
        </>
      )}
      {phase === GamePhase.Paused && (
        <>
          <PauseMenu />
          <DebugPanel /> {/* Keep debug panel visible when paused */}
        </>
      )}
      {phase === GamePhase.GameOver && <GameOverMenu />}
    </div>
  );
}