"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { fetchBtcCandles, type Candle } from "@/utils/binance";
import CryptoChart from "./CryptoChart";
import ProfitDisplay from "./ProfitDisplay";
import TradeControls, {
  type Position,
  type PositionType,
} from "./TradeControls";

const DRIP_SPEED_MS = 500;
const GAME_DURATION_S = 30;
const INITIAL_VISIBLE = 60;

type GameState = "IDLE" | "PLAYING" | "GAME_OVER";

export type GameWindowHandle = {
  start: () => void;
  stop: () => void;
};

type Props = {
  ref?: Ref<GameWindowHandle>;
  onGameEnd: (finalScore: number) => void;
};

function pnlFor(position: Position, price: number): number {
  return position.type === "LONG"
    ? price - position.entryPrice
    : position.entryPrice - price;
}

export default function GameWindow({ ref, onGameEnd }: Props) {
  const [gameState, setGameState] = useState<GameState>("IDLE");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
  const [visibleData, setVisibleData] = useState<Candle[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [realizedPnL, setRealizedPnL] = useState(0);

  const queuedData = useRef<Candle[]>([]);
  const loopInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(GAME_DURATION_S);
  const onGameEndRef = useRef(onGameEnd);
  const closePositionRef = useRef<() => number>(() => 0);

  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  }, [onGameEnd]);

  const currentPrice =
    visibleData.length > 0 ? visibleData[visibleData.length - 1].close : 0;
  const unrealizedPnL = position ? pnlFor(position, currentPrice) : 0;

  const clearLoop = useCallback(() => {
    if (loopInterval.current !== null) {
      clearInterval(loopInterval.current);
      loopInterval.current = null;
    }
  }, []);

  useEffect(() => clearLoop, [clearLoop]);

  const openPosition = useCallback(
    (type: PositionType) => {
      if (visibleData.length === 0) return;
      const entryPrice = visibleData[visibleData.length - 1].close;
      setPosition({ type, entryPrice });
    },
    [visibleData],
  );

  const closePosition = useCallback((): number => {
    if (!position || visibleData.length === 0) return realizedPnL;
    const exitPrice = visibleData[visibleData.length - 1].close;
    const newTotal = realizedPnL + pnlFor(position, exitPrice);
    setRealizedPnL(newTotal);
    setPosition(null);
    return newTotal;
  }, [position, visibleData, realizedPnL]);

  useEffect(() => {
    closePositionRef.current = closePosition;
  }, [closePosition]);

  const startGame = useCallback(async () => {
    clearLoop();
    setGameState("IDLE");
    timeLeftRef.current = GAME_DURATION_S;
    setTimeLeft(GAME_DURATION_S);
    setVisibleData([]);
    setPosition(null);
    setRealizedPnL(0);
    queuedData.current = [];

    const candles = await fetchBtcCandles();

    setVisibleData(candles.slice(0, INITIAL_VISIBLE));
    queuedData.current = candles.slice(INITIAL_VISIBLE);
    setGameState("PLAYING");

    const tickSeconds = DRIP_SPEED_MS / 1000;

    loopInterval.current = setInterval(() => {
      const next = queuedData.current.shift();
      if (next) {
        setVisibleData((prev) => [...prev, next]);
      }

      const updated = Math.max(0, timeLeftRef.current - tickSeconds);
      timeLeftRef.current = updated;
      setTimeLeft(updated);

      if (updated <= 0) {
        clearLoop();
        const finalScore = closePositionRef.current();
        setGameState("GAME_OVER");
        onGameEndRef.current(finalScore);
      }
    }, DRIP_SPEED_MS);
  }, [clearLoop]);

  const stopGame = useCallback(() => {
    clearLoop();
    setGameState("IDLE");
    timeLeftRef.current = GAME_DURATION_S;
    setTimeLeft(GAME_DURATION_S);
  }, [clearLoop]);

  useImperativeHandle(
    ref,
    () => ({ start: startGame, stop: stopGame }),
    [startGame, stopGame],
  );

  const canOpen = gameState === "PLAYING" && position === null;

  return (
    <div className="space-y-4 rounded-xl border border-gray-700 bg-gray-900/60 p-6 shadow-2xl">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Ape Trader</h1>
        <div className="flex items-center gap-3 font-mono text-sm">
          <span className="text-gray-400">State:</span>
          <span className="text-white">{gameState}</span>
          <span className="text-gray-400">Time:</span>
          <span className="text-white">{timeLeft.toFixed(1)}s</span>
        </div>
      </header>

      <ProfitDisplay realizedPnL={realizedPnL} unrealizedPnL={unrealizedPnL} />

      <div className="flex gap-4">
        <TradeControls
          position={position}
          canOpen={canOpen}
          onOpen={openPosition}
          onClose={closePosition}
        />
        <div className="flex-1">
          <CryptoChart data={visibleData} />
        </div>
      </div>
    </div>
  );
}
