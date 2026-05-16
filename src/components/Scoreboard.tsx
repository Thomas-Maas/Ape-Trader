"use client";

import { useEffect, useState } from "react";

type Entry = { username: string; highscore: number };

type Props = {
  refreshKey?: number;
};

export default function Scoreboard({ refreshKey = 0 }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/scoreboard")
      .then((r) => r.json())
      .then((data: { entries: Entry[] }) => {
        if (!cancelled) setEntries(data.entries);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="w-full rounded-lg border border-gray-700 bg-gray-900/80 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-400">
        Leaderboard
      </h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">
          No scores yet — be the first ape.
        </p>
      ) : (
        <ol className="space-y-1">
          {entries.map((e, i) => (
            <li
              key={e.username}
              className="flex items-center justify-between rounded px-2 py-1 font-mono text-sm odd:bg-gray-800/40"
            >
              <span className="flex items-center gap-3">
                <span className="w-6 text-right text-gray-500">{i + 1}.</span>
                <span className="text-white">{e.username}</span>
              </span>
              <span
                className={
                  e.highscore > 0
                    ? "text-green-400"
                    : e.highscore < 0
                      ? "text-red-400"
                      : "text-gray-300"
                }
              >
                ${e.highscore.toFixed(2)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
