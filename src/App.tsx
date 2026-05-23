import { useEffect } from 'react';
import Game from '@/game/Game';
import MainMenu from '@/ui/MainMenu';
import GameOverMenu from '@/ui/GameOverMenu';
import PauseMenu from '@/ui/PauseMenu';
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

  // Global Escape handler toggles pause while playing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (phase === GamePhase.Playing) setPhase(GamePhase.Paused);
        else if (phase === GamePhase.Paused) setPhase(GamePhase.Playing);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, setPhase]);

  return (
    <div className="relative h-full w-full">
      {/* 3D world always rendered so assets stay warm between phases. */}
      <Game />

      {/* Overlay UI, conditionally rendered based on phase. */}
      {phase === GamePhase.Menu && <MainMenu />}
      {phase === GamePhase.Playing && <HUD />}
      {phase === GamePhase.Paused && <PauseMenu />}
      {phase === GamePhase.GameOver && <GameOverMenu />}
    </div>
  );
}