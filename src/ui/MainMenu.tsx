import { useGameStore } from '@/store/gameStore';

/**
 * Main menu shown on startup. A single "Start" button kicks off a run.
 */
export default function MainMenu() {
  const startRun = useGameStore((s) => s.startRun);
  const bestScore = useGameStore((s) => s.bestScore);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-900/80 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col items-center gap-8 rounded-3xl bg-white/5 p-10 text-center ring-1 ring-white/10">
        <div>
          <h1 className="font-display text-6xl tracking-tight text-aqua-200 drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]">
            AquaRush
          </h1>
          <p className="mt-2 text-sm text-white/70">
            An endless waterslide. Hold on tight.
          </p>
        </div>

        <button
          onClick={startRun}
          className="w-full rounded-2xl bg-gradient-to-br from-aqua-400 to-aqua-600 px-6 py-4 text-xl font-bold text-white shadow-lg shadow-aqua-600/40 transition-transform hover:scale-[1.02] active:scale-95"
        >
          ▶ Start Run
        </button>

        {bestScore > 0 && (
          <p className="text-sm text-white/60">
            Best score: <span className="font-bold text-aqua-200">{bestScore.toLocaleString()}</span>
          </p>
        )}

        <div className="text-xs text-white/40">
          Move with <kbd className="rounded bg-white/10 px-1.5 py-0.5">A</kbd> /{' '}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5">D</kbd> · Pause with{' '}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5">Esc</kbd>
        </div>
      </div>
    </div>
  );
}