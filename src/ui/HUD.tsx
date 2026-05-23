import { useGameStore } from '@/store/gameStore';

/**
 * In-game heads-up display. Shows live run stats.
 * Rendered as plain HTML via Tailwind so it stays crisp at any resolution
 * and is trivial to style.
 */
export default function HUD() {
  const score = useGameStore((s) => Math.floor(s.score));
  const coins = useGameStore((s) => s.coins);
  const distance = useGameStore((s) => Math.floor(s.distance));
  const speed = useGameStore((s) => Math.floor(s.speed));

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col p-6 font-display">
      <div className="flex items-start justify-between">
        <StatCard label="Score" value={score.toLocaleString()} accent="text-aqua-200" />
        <div className="flex gap-3">
          <StatCard label="Coins" value={`🪙 ${coins}`} accent="text-yellow-300" />
          <StatCard label="Distance" value={`${distance} m`} accent="text-emerald-300" />
          <StatCard label="Speed" value={`${speed}`} accent="text-pink-300" />
        </div>
      </div>

      <div className="mt-auto text-center text-xs text-white/50">
        A / D or ← / → to steer · Esc to pause
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  accent: string;
}

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className="rounded-xl bg-black/30 px-4 py-2 backdrop-blur-md ring-1 ring-white/10">
      <div className="text-[10px] uppercase tracking-widest text-white/60">{label}</div>
      <div className={`text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}