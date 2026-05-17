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
      className="relative flex min-h-screen items-center justify-center p-6 bg-gray-950 bg-cover bg-center transition-[background-image]"
      style={!showHome ? { backgroundImage: "url('/game_view_background.png')" } : undefined}
    >
      {!showHome && (
        <button
          onClick={handleGoHome}
          className="absolute left-4 top-4 rounded-lg border border-gray-700 bg-gray-900/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          ← Home
        </button>
      )}

      <div className="absolute right-4 top-4">
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
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-10 py-8 z-10">
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
