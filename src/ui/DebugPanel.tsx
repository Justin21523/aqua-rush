import { useGameStore } from '@/store/gameStore';

/**
 * A floating debug panel for testing game mechanics.
 * Displays live stats and allows toggling God Mode.
 */
export default function DebugPanel() {
  const isGodMode = useGameStore((s) => s.isGodMode);
  const toggleGodMode = useGameStore((s) => s.toggleGodMode);
  const currentChunkIndex = useGameStore((s) => s.currentChunkIndex);
  const speed = useGameStore((s) => s.speed);
  const phase = useGameStore((s) => s.phase);

  // Only show during active gameplay or pause
  if (phase !== 'playing' && phase !== 'paused') return null;

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-50 flex w-48 flex-col gap-2 rounded-lg bg-black/80 p-3 font-mono text-xs text-green-400 shadow-lg ring-1 ring-green-500/30 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-green-500/30 pb-1.5">
        <span className="font-bold tracking-wider text-green-300">DEBUG</span>
        <button
          onClick={toggleGodMode}
          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase transition-all ${
            isGodMode 
              ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          God: {isGodMode ? 'ON' : 'OFF'}
        </button>
      </div>
      
      <div className="flex flex-col gap-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-green-600">Chunk:</span>
          <span className="text-green-200">#{currentChunkIndex}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-600">Speed:</span>
          <span className="text-green-200">{speed.toFixed(1)} u/s</span>
        </div>
      </div>
      
      <div className="mt-1 border-t border-green-500/20 pt-1 text-center text-[9px] text-green-700">
        Press [G] to toggle God Mode
      </div>
    </div>
  );
}