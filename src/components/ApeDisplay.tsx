"use client";

import { useEffect, useRef, useState } from "react";

const HAPPY_THRESHOLD = 50;
const ANGRY_THRESHOLD = -50;
const CYCLE_MS = 2000;
const ACTION_MS = 800;

type GameState = "IDLE" | "PLAYING" | "GAME_OVER";
type Mood = "NEUTRAL" | "HAPPY" | "NEGATIVE" | "ANGRY" | "WON" | "LOST";

type Props = {
  gameState: GameState;
  realizedPnL: number;
  unrealizedPnL: number;
  finalScore: number | null;
  actionTick: { action: "LONG" | "SHORT" | "CLOSE"; id: number } | null;
};

const FRAMES: Record<Mood, string[]> = {
  NEUTRAL:  ["Ape_Idle.png", "Ape_Thinking.png"],
  HAPPY:    ["Ape_Idle.png", "Ape_Thinking.png", "Ape_Won.png"],
  NEGATIVE: ["Ape_Thinking.png"],
  ANGRY:    ["Ape_Thinking.png", "Ape_Angry_Thinking.png"],
  WON:      ["Ape_Won.png"],
  LOST:     ["Ape_Lost.png"],
};

const ACTION_IMAGE: Record<string, string> = {
  LONG:  "Ape_Long.png",
  SHORT: "Ape_Short.png",
  CLOSE: "Ape_Close.png",
};

function getMood(gameState: GameState, totalPnL: number, finalScore: number | null): Mood {
  if (gameState === "GAME_OVER") return (finalScore ?? totalPnL) >= 0 ? "WON" : "LOST";
  if (totalPnL >= HAPPY_THRESHOLD) return "HAPPY";
  if (totalPnL <= ANGRY_THRESHOLD) return "ANGRY";
  if (totalPnL < 0) return "NEGATIVE";
  return "NEUTRAL";
}

export default function ApeDisplay({ gameState, realizedPnL, unrealizedPnL, finalScore, actionTick }: Props) {
  const totalPnL = realizedPnL + unrealizedPnL;
  const mood = getMood(gameState, totalPnL, finalScore);

  const [frameIndex, setFrameIndex] = useState(0);
  const [overrideImage, setOverrideImage] = useState<string | null>(null);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevMoodRef = useRef<Mood>(mood);

  useEffect(() => {
    if (prevMoodRef.current !== mood) {
      prevMoodRef.current = mood;
      setFrameIndex(0);
    }
  }, [mood]);

  useEffect(() => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    const frames = FRAMES[mood];
    if (frames.length <= 1) { cycleRef.current = null; return; }
    cycleRef.current = setInterval(() => setFrameIndex((i) => (i + 1) % frames.length), CYCLE_MS);
    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
  }, [mood]);

  useEffect(() => {
    if (!actionTick) return;
    const img = ACTION_IMAGE[actionTick.action];
    const show = setTimeout(() => setOverrideImage(img), 0);
    const hide = setTimeout(() => setOverrideImage(null), ACTION_MS);
    return () => { clearTimeout(show); clearTimeout(hide); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionTick?.id]);

  const frames = FRAMES[mood];
  const displayImage = overrideImage ?? frames[frameIndex % frames.length];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/ape/${displayImage}`} alt="ape" className="w-full object-contain" />
  );
}
