"use client";

import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import ApeDisplay from "./ApeDisplay";
import GameWindow, { type GameWindowHandle } from "./GameWindow";
import TradeControls, { type Position } from "./TradeControls";

export type GameViewHandle = {
  stop: () => void;
};

type Props = {
  ref?: Ref<GameViewHandle>;
  onGameEnd: (finalScore: number, highscore: number) => void;
};

type ApeGameState = "IDLE" | "PLAYING" | "GAME_OVER";

export default function GameView({ ref, onGameEnd }: Props) {
  const gameWindowRef = useRef<GameWindowHandle>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [apeGameState, setApeGameState] = useState<ApeGameState>("IDLE");
  const [apePnL, setApePnL] = useState({ realized: 0, unrealized: 0 });
  const [apeFinalScore, setApeFinalScore] = useState<number | null>(null);
  const [actionTick, setActionTick] = useState<{
    action: "LONG" | "SHORT" | "CLOSE";
    id: number;
  } | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const actionIdRef = useRef(0);

  const handleStart = useCallback(async () => {
    setHasStarted(true);
    setApeGameState("PLAYING");
    setApePnL({ realized: 0, unrealized: 0 });
    setApeFinalScore(null);
    setActionTick(null);
    setPosition(null);

    const res = await fetch("/api/game/start", { method: "POST" });
    if (!res.ok) return;
    const data = (await res.json()) as { sessionId: string; candles: unknown[] };
    setSessionId(data.sessionId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gameWindowRef.current?.startWithCandles(data.candles as any);
  }, []);

  const handleStop = useCallback(() => {
    setHasStarted(false);
    setApeGameState("IDLE");
    setSessionId(null);
    gameWindowRef.current?.stop();
  }, []);

  const handleGameEnd = useCallback(
    (finalScore: number, highscore: number) => {
      setApeFinalScore(finalScore);
      setApeGameState("GAME_OVER");
      onGameEnd(finalScore, highscore);
    },
    [onGameEnd],
  );

  const handleAction = useCallback((action: "LONG" | "SHORT" | "CLOSE") => {
    setActionTick({ action, id: ++actionIdRef.current });
  }, []);

  const handlePnLUpdate = useCallback((realized: number, unrealized: number) => {
    setApePnL({ realized, unrealized });
  }, []);

  const canOpen = apeGameState === "PLAYING" && position === null;

  useImperativeHandle(ref, () => ({ stop: handleStop }), [handleStop]);

  return (
    <div className="flex gap-6">
      {/* Left: big ape + controls + start button */}
      <div className="flex w-2/5 shrink-0 flex-col gap-4">
        <div className="rounded-xl border border-gray-700 bg-gray-900/95 p-4 shadow-2xl">
          <ApeDisplay
            gameState={apeGameState}
            realizedPnL={apePnL.realized}
            unrealizedPnL={apePnL.unrealized}
            finalScore={apeFinalScore}
            actionTick={actionTick}
          />
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-900/95 p-4 shadow-2xl">
          <TradeControls
            position={position}
            canOpen={canOpen}
            onOpen={(type) => gameWindowRef.current?.openPosition(type)}
            onClose={() => gameWindowRef.current?.closePosition()}
          />
          <button
            onClick={handleStart}
            className="mt-3 w-full rounded-lg bg-yellow-500 px-6 py-2 font-bold text-black shadow transition hover:bg-yellow-400"
          >
            {hasStarted ? "Play Again" : "Start Game"}
          </button>
        </div>
      </div>

      {/* Right: game window */}
      <div className="min-w-0 flex-1">
        <GameWindow
          ref={gameWindowRef}
          onGameEnd={handleGameEnd}
          onAction={handleAction}
          onPnLUpdate={handlePnLUpdate}
          onPositionChange={setPosition}
          sessionId={sessionId}
        />
      </div>
    </div>
  );
}
