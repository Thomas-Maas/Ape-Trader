"use client";

import { useEffect, useState } from "react";

// Edit this date to set the deadline manually
const TARGET = new Date("2026-05-18T00:00:00");

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function Countdown() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = TARGET;
    const tick = () => setRemaining(target.getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (remaining === null) return null;

  const done = remaining <= 0;

  return (
    <div className="flex items-center gap-2 text-yellow-400 font-mono font-bold text-lg">
      <span className="text-gray-400 text-sm font-sans font-normal">⏱</span>
      {done ? (
        <span className="text-red-400">Time&apos;s up!</span>
      ) : (
        <span>{formatRemaining(remaining)} Left!</span>
      )}
    </div>
  );
}
