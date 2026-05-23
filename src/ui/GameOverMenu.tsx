import { useGameStore, GamePhase } from '@/store/gameStore';

export default function GameOverMenu() {
  const score = useGameStore((s) => Math.floor(s.score));
  const coins = useGameStore((s) => s.coins);
  const distance = useGameStore((s) => Math.floor(s.distance));
  const bestScore = useGameStore((s) => s.bestScore);
  const startRun = useGameStore((s) => s.startRun);
  const setPhase = useGameStore((s) => s.setPhase);

  const isNewBest = score >= bestScore && score > 0;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl bg-white/5 p-10 ring-1 ring-white/10">
        <div className="text-center">
          <h2 className="font-display text-5xl text-pink-400">Wipeout!</h2>
          {isNewBest && (
            <p className="mt-2 animate-pulse-slow text-sm font-semibold text-yellow-300">
              ✨ New best score! ✨
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <SummaryCell label="Score" value={score.toLocaleString()} />
          <SummaryCell label="Coins" value={String(coins)} />
          <SummaryCell label="Distance" value={`${distance} m`} />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={startRun}
            className="rounded-2xl bg-gradient-to-br from-aqua-400 to-aqua-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-aqua-600/40 transition-transform hover:scale-[1.02] active:scale-95"
          >
            ▶ Try Again
          </button>
          <button
            onClick={() => setPhase(GamePhase.Menu)}
            className="rounded-xl bg-white/10 px-4 py-3 font-semibold text-white/80 transition hover:bg-white/20"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
      <div className="text-[10px] uppercase tracking-widest text-white/60">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
    </div>
  );
}