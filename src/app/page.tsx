"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import GameView, { type GameViewHandle } from "@/components/GameView";
import HomeScreen from "@/components/HomeScreen";
import AuthPanel, { type AuthedUser } from "@/components/AuthPanel";
import UserBadge from "@/components/UserBadge";
import Scoreboard from "@/components/Scoreboard";

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
    async (finalScore: number) => {
      if (!user) return;
      try {
        const res = await fetch("/api/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: finalScore }),
        });
        if (res.ok) {
          const data = (await res.json()) as { highscore: number };
          setUser({ username: user.username, highscore: data.highscore });
          setScoreboardKey((k) => k + 1);
        }
      } catch {
        // best-effort submission, ignore network errors
      }
    },
    [user],
  );

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/30 p-6">
            <HomeScreen onPlay={handlePlay} />
            <div className="pointer-events-auto z-10 w-full max-w-md">
              <Scoreboard refreshKey={scoreboardKey} />
            </div>
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
