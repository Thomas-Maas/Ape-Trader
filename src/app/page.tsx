"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameView, { type GameViewHandle } from "@/components/GameView";
import HomeScreen from "@/components/HomeScreen";
import AuthPanel, { type AuthedUser } from "@/components/AuthPanel";
import UserBadge from "@/components/UserBadge";

export default function Home() {
  const [showHome, setShowHome] = useState(true);
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [scoreboardKey, setScoreboardKey] = useState(0);
  const gameRef = useRef<GameViewHandle>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user: AuthedUser | null }) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const handlePlay = useCallback(() => {
    setShowHome(false);
  }, []);

  const handleGoHome = useCallback(() => {
    gameRef.current?.stop();
    setShowHome(true);
    setScoreboardKey((k) => k + 1);
  }, []);

  const handleGameEnd = useCallback(
    (_finalScore: number, highscore: number) => {
      if (!user) return;
      setUser({ username: user.username, highscore });
      setScoreboardKey((k) => k + 1);
    },
    [user],
  );

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-3 pt-16 pb-4 bg-gray-950 bg-cover bg-center transition-[background-image] sm:p-6"
      style={!showHome ? { backgroundImage: "url('/game_view_background.png')" } : undefined}
    >
      {!showHome && (
        <button
          onClick={handleGoHome}
          className="absolute left-3 top-3 rounded-lg border border-gray-700 bg-gray-900/80 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 sm:left-4 sm:top-4 sm:px-4 sm:py-2 sm:text-sm"
        >
          ← Home
        </button>
      )}

      <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
        <UserBadge
          user={user}
          onLoginClick={() => setAuthOpen(true)}
          onLogout={handleLogout}
        />
      </div>

      <div className="relative w-full max-w-4xl">
        <div
          className={`transition-all duration-300 ${
            showHome ? "pointer-events-none blur-md" : ""
          }`}
          aria-hidden={showHome}
        >
          <GameView ref={gameRef} onGameEnd={handleGameEnd} />
        </div>

        {showHome && (
          <div className="fixed inset-0 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 px-4 pt-16 pb-8 z-10 lg:items-center lg:px-10 lg:py-8">
            <HomeScreen onPlay={handlePlay} refreshKey={scoreboardKey} />
          </div>
        )}
      </div>

      {authOpen && (
        <AuthPanel
          onAuth={(u) => {
            setUser(u);
            setAuthOpen(false);
            setScoreboardKey((k) => k + 1);
          }}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </main>
  );
}
