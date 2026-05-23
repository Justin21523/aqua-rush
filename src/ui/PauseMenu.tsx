import { useGameStore, GamePhase } from '@/store/gameStore';

export default function PauseMenu() {
  const setPhase = useGameStore((s) => s.setPhase);
  const endRun = useGameStore((s) => s.endRun);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-md">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white/5 p-8 ring-1 ring-white/10">
        <h2 className="text-center font-display text-4xl text-white">Paused</h2>

        <button
          onClick={() => setPhase(GamePhase.Playing)}
          className="rounded-xl bg-aqua-500 px-4 py-3 font-bold text-white transition hover:bg-aqua-400"
        >
          Resume
        </button>

        <button
          onClick={endRun}
          className="rounded-xl bg-white/10 px-4 py-3 font-semibold text-white/80 transition hover:bg-white/20"
        >
          Quit to Menu
        </button>
      </div>
    </div>
  );
}