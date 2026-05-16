"use client";

import Image from "next/image";
import { useState } from "react";
import Countdown from "./Countdown";
import Scoreboard from "./Scoreboard";

type Props = {
  onPlay: () => void;
  refreshKey?: number;
};

export default function HomeScreen({ onPlay, refreshKey = 0 }: Props) {
  const [showInfo, setShowInfo] = useState(true);

  return (
    <div className="grid grid-cols-3 gap-10 w-full max-w-6xl min-h-130 items-stretch">
      {/* Left: logo + how to play + rules */}
      <div className="flex flex-col gap-6 justify-between">
        <div className="flex flex-col gap-6">
          <Image
            src="/northcrypto_logo.svg"
            alt="Northcrypto"
            width={200}
            height={62}
            className="brightness-0 invert opacity-80 w-48 h-auto"
          />

          <div>
            <button
              onClick={() => setShowInfo((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-300 hover:text-white transition mb-3"
            >
              How to play <span className="text-gray-500">{showInfo ? "▴" : "▾"}</span>
            </button>

            {showInfo && (
              <p className="text-sm text-gray-400 leading-relaxed">
                You get to help Northcrypto&apos;s most loyal staff member,{" "}
                <span className="text-white font-semibold">Mon(k)ey Man</span>, feed
                himself and his family. Press and hold to open a long position at the
                current price — if the price goes up, selling nets you the difference.
                If it goes down, you take a loss. Shorting does the opposite: you
                profit when price falls. Generate as much profit as possible before
                time runs out to secure your spot on the leaderboard!
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Rules
          </p>
          <ol className="text-sm text-gray-400 leading-relaxed list-decimal list-inside space-y-2">
            <li>Create an account before playing to save your score to the leaderboard.</li>
            <li>
              This version is a demo. Any promises regarding payment or prizes are
              placeholders and not legally binding.
            </li>
          </ol>
        </div>
      </div>

      {/* Center: prize text + coin of week + countdown + play */}
      <div className="flex flex-col items-center justify-between gap-6 text-center py-4">
        <h1 className="text-2xl font-bold text-white leading-snug">
          Win €100 in this week&apos;s currency by being the scoreboard leader!
        </h1>

        <div className="flex flex-col items-center gap-2">
          <span className="text-gray-400 text-xl">Northcrypto&apos;s coin of the week:</span>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-white">Bitcoin</span>
            <Image
              src="/Bitcoin.svg.svg"
              alt="Bitcoin"
              width={50}
              height={50}
              className="h-9 w-9"
            />
          </div>
        </div>

        <Countdown />

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onPlay}
            aria-label="Play"
            className="flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-2xl transition hover:scale-105 hover:bg-gray-100"
          >
            <svg
              viewBox="0 0 24 24"
              className="ml-1 h-12 w-12 fill-black"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <span className="text-sm font-semibold uppercase tracking-widest text-white drop-shadow">
            Play
          </span>
        </div>
      </div>

      {/* Right: scoreboard */}
      <div className="flex flex-col w-full">
        <Scoreboard refreshKey={refreshKey} />
      </div>
    </div>
  );
}
