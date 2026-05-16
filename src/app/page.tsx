"use client";

import { useCallback, useRef, useState } from "react";
import GameView, { type GameViewHandle } from "@/components/GameView";
import HomeScreen from "@/components/HomeScreen";

export default function Home() {
  const [showHome, setShowHome] = useState(true);
  const gameRef = useRef<GameViewHandle>(null);

  const handleGameEnd = useCallback(() => {}, []);

  const handlePlay = useCallback(() => {
    setShowHome(false);
  }, []);

  const handleGoHome = useCallback(() => {
    gameRef.current?.stop();
    setShowHome(true);
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gray-950 p-6">
      {!showHome && (
        <button
          onClick={handleGoHome}
          className="absolute left-4 top-4 rounded-lg border border-gray-700 bg-gray-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          ← Home
        </button>
      )}

      <div className="relative w-full max-w-4xl">
        <div
          className={`transition-all duration-300 ${
            showHome ? "pointer-events-none blur-md" : ""
          }`}
          aria-hidden={showHome}
        >
          <GameView ref={gameRef} onGameEnd={handleGameEnd} />
        </div>
        {showHome && <HomeScreen onPlay={handlePlay} />}
      </div>
    </main>
  );
}
