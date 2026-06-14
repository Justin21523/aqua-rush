import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore, GamePhase } from '@/store/gameStore';
import { SLIDE } from '@/utils/constants';
import { SlideGenerator } from './SlideGenerator';
import { SlideChunkData } from './SlideTypes';

/**
 * Manages the lifecycle of slide chunks.
 * It generates chunks ahead of the player and culls chunks far behind,
 * ensuring infinite gameplay with minimal memory footprint.
 */
export default function SlideManager() {
  const phase = useGameStore((s) => s.phase);
  const setChunks = useGameStore((s) => s.setChunks);
  
  const generatorRef = useRef(new SlideGenerator());
  const chunksRef = useRef<SlideChunkData[]>([]);

  // Initialize chunks when a new run starts
  useEffect(() => {
    if (phase === GamePhase.Playing) {
      generatorRef.current.reset();
      chunksRef.current = [];
      
      // Generate initial set of chunks
      const initialCount = SLIDE.LOOK_AHEAD_CHUNKS + 2;
      for (let i = 0; i < initialCount; i++) {
        chunksRef.current.push(generatorRef.current.generateNext());
      }
      setChunks([...chunksRef.current]);
    }
  }, [phase, setChunks]);

  // Stream chunks in and out based on player progress
  useFrame(() => {
    if (phase !== GamePhase.Playing) return;

    const currentChunkIndex = useGameStore.getState().currentChunkIndex;
    let changed = false;

    // 1. Cull chunks far behind the player
    while (
      chunksRef.current.length > 0 &&
      chunksRef.current[0].index < currentChunkIndex - SLIDE.LOOK_BEHIND_CHUNKS
    ) {
      chunksRef.current.shift();
      changed = true;
    }

    // 2. Generate chunks ahead of the player.
    // NOTE: lastIndex must be re-evaluated each iteration — a const snapshot here
    // would create an infinite loop because the condition never changes.
    while (
      chunksRef.current.length === 0 ||
      chunksRef.current[chunksRef.current.length - 1].index < currentChunkIndex + SLIDE.LOOK_AHEAD_CHUNKS
    ) {
      chunksRef.current.push(generatorRef.current.generateNext());
      changed = true;
    }

    // 3. Sync to Zustand only if changes occurred (avoids unnecessary re-renders)
    if (changed) {
      setChunks([...chunksRef.current]);
    }
  });

  return null; // This component handles logic, not rendering
}
