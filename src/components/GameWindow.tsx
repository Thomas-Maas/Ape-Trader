"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import type { Candle } from "@/utils/binance";
import { DRIP_SPEED_MS, GAME_DURATION_S } from "@/lib/gameConfig";
import CryptoChart from "./CryptoChart";
import ProfitDisplay from "./ProfitDisplay";
import TradeControls, {
  type Position,
  type PositionType,
} from "./TradeControls";

type GameState = "IDLE" | "PLAYING" | "GAME_OVER";

export type GameWindowHandle = {
  startWithCandles: (candles: Candle[]) => void;
  stop: () => void;
};

type Props = {
  ref?: Ref<GameWindowHandle>;
  onGameEnd: (finalScore: number, highscore: number) => void;
  onAction?: (action: "LONG" | "SHORT" | "CLOSE") => void;
  onPnLUpdate?: (realized: number, unrealized: number) => void;
  sessionId: string | null;
};

function pnlFor(position: Position, price: number): number {
  return position.type === "LONG"
    ? price - position.entryPrice
    : position.entryPrice - price;
}

export default function GameWindow({ ref, onGameEnd, onAction, onPnLUpdate, sessionId }: Props) {
  const [gameState, setGameState] = useState<GameState>("IDLE");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_S);
  const [visibleData, setVisibleData] = useState<Candle[]>([]);
  const [position, setPosition] = useState<Position | null>(null);
  const [realizedPnL, setRealizedPnL] = useState(0);

  const loopInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(GAME_DURATION_S);
  const onGameEndRef = useRef(onGameEnd);
  const onActionRef = useRef(onAction);
  const onPnLUpdateRef = useRef(onPnLUpdate);
  const sessionIdRef = useRef(sessionId);
  const visibleDataRef = useRef(visibleData);
  const positionRef = useRef(position);
  const realizedPnLRef = useRef(realizedPnL);

  useEffect(() => { onGameEndRef.current = onGameEnd; }, [onGameEnd]);
  useEffect(() => { onActionRef.current = onAction; }, [onAction]);
  useEffect(() => { onPnLUpdateRef.current = onPnLUpdate; }, [onPnLUpdate]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { visibleDataRef.current = visibleData; }, [visibleData]);
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { realizedPnLRef.current = realizedPnL; }, [realizedPnL]);

  const currentPrice =
    visibleData.length > 0 ? visibleData[visibleData.length - 1].close : 0;
  const unrealizedPnL = position ? pnlFor(position, currentPrice) : 0;

  useEffect(() => {
    onPnLUpdateRef.current?.(realizedPnL, unrealizedPnL);
  }, [realizedPnL, unrealizedPnL]);

  const clearLoop = useCallback(() => {
    if (loopInterval.current !== null) {
      clearInterval(loopInterval.current);
      loopInterval.current = null;
    }
  }, []);

  useEffect(() => clearLoop, [clearLoop]);

  const endGame = useCallback(async () => {
    clearLoop();
    setGameState("GAME_OVER");
    const sid = sessionIdRef.current;
    if (!sid) return;
    try {
      const res = await fetch("/api/game/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      });
      if (res.ok) {
        const data = (await res.json()) as { score: number; highscore: number };
        onGameEndRef.current(data.score, data.highscore);
      }
    } catch {
      // best-effort
    }
  }, [clearLoop]);

  const openPosition = useCallback((type: PositionType) => {
    const data = visibleDataRef.current;
    if (data.length === 0) return;
    setPosition({ type, entryPrice: data[data.length - 1].close });
    onActionRef.current?.(type);

    const sid = sessionIdRef.current;
    if (sid) {
      fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, action: type, candleIndex: data.length - 1 }),
      }).catch(() => undefined);
    }
  }, []);

  const closePosition = useCallback(() => {
    const pos = positionRef.current;
    const data = visibleDataRef.current;
    if (!pos || data.length === 0) return;
    const newTotal = realizedPnLRef.current + pnlFor(pos, data[data.length - 1].close);
    setRealizedPnL(newTotal);
    setPosition(null);
    onActionRef.current?.("CLOSE");

    const sid = sessionIdRef.current;
    if (sid) {
      fetch("/api/game/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, action: "CLOSE", candleIndex: data.length - 1 }),
      }).catch(() => undefined);
    }
  }, []);

  const startGame = useCallback((candles: Candle[]) => {
    clearLoop();
    timeLeftRef.current = GAME_DURATION_S;
    setTimeLeft(GAME_DURATION_S);
    setVisibleData(candles);
    setPosition(null);
    setRealizedPnL(0);
    setGameState("PLAYING");

    const tickSeconds = DRIP_SPEED_MS / 1000;

    loopInterval.current = setInterval(async () => {
      const sid = sessionIdRef.current;
      if (sid) {
        try {
          const res = await fetch(`/api/game/candle?sessionId=${sid}`);
          if (res.ok) {
            const data = (await res.json()) as { candle: Candle | null };
            if (data.candle) {
              setVisibleData((prev) => [...prev, data.candle!]);
            }
          }
        } catch {
          // best-effort — chart just won't advance this tick
        }
      }

      const updated = Math.max(0, timeLeftRef.current - tickSeconds);
      timeLeftRef.current = updated;
      setTimeLeft(updated);

      if (updated <= 0) {
        endGame();
      }
    }, DRIP_SPEED_MS);
  }, [clearLoop, endGame]);

  const stopGame = useCallback(() => {
    clearLoop();
    setGameState("IDLE");
    timeLeftRef.current = GAME_DURATION_S;
    setTimeLeft(GAME_DURATION_S);
  }, [clearLoop]);

  useImperativeHandle(
    ref,
    () => ({ startWithCandles: startGame, stop: stopGame }),
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
