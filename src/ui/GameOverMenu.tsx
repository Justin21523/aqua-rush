import { useGameStore, GamePhase } from '@/store/gameStore';

export default function GameOverMenu() {
  const score = useGameStore((s) => Math.floor(s.score));
  const coins = useGameStore((s) => s.coins);
  const distance = useGameStore((s) => Math.floor(s.distance));
  const leaderboard = useGameStore((s) => s.leaderboard);
  const startRun = useGameStore((s) => s.startRun);
  const setPhase = useGameStore((s) => s.setPhase);

  const isNewBest = leaderboard.length > 0 && leaderboard[0].score === score;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-3xl bg-white/5 p-8 ring-1 ring-white/10 shadow-2xl">
        <div className="text-center">
          <h2 className="font-display text-5xl text-pink-400 drop-shadow-lg">Wipeout!</h2>
          {isNewBest && (
            <p className="mt-2 animate-bounce text-sm font-semibold text-yellow-300">
              👑 New High Score! 👑
            </p>
          )}
        </div>

        {/* Current Run Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <SummaryCell label="Score" value={score.toLocaleString()} />
          <SummaryCell label="Coins" value={String(coins)} />
          <SummaryCell label="Distance" value={`${distance}m`} />
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl bg-black/40 p-4 ring-1 ring-white/5">
          <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-aqua-200">
            🏆 Top Runs
          </h3>
          <div className="flex flex-col gap-2">
            {leaderboard.map((record, i) => (
              <div 
                key={i} 
                className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
                  record.score === score && i === 0 ? 'bg-yellow-500/20 text-yellow-200' : 'text-white/70'
                }`}
              >
                <span className="font-mono font-bold">#{i + 1}</span>
                <span className="font-bold">{record.score.toLocaleString()} pts</span>
                <span className="text-xs text-white/50">{record.distance}m</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
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