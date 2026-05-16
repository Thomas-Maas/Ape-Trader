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

export type GameViewHandle = {
  stop: () => void;
};

type Props = {
  ref?: Ref<GameViewHandle>;
  onGameEnd: (finalScore: number) => void;
};

type ApeGameState = "IDLE" | "PLAYING" | "GAME_OVER";

export default function GameView({ ref, onGameEnd }: Props) {
  const gameWindowRef = useRef<GameWindowHandle>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const [apeGameState, setApeGameState] = useState<ApeGameState>("IDLE");
  const [apePnL, setApePnL] = useState({ realized: 0, unrealized: 0 });
  const [apeFinalScore, setApeFinalScore] = useState<number | null>(null);
  const [actionTick, setActionTick] = useState<{
    action: "LONG" | "SHORT" | "CLOSE";
    id: number;
  } | null>(null);
  const actionIdRef = useRef(0);

  const handleStart = useCallback(() => {
    setHasStarted(true);
    setApeGameState("PLAYING");
    setApePnL({ realized: 0, unrealized: 0 });
    setApeFinalScore(null);
    setActionTick(null);
    gameWindowRef.current?.start();
  }, []);

  const handleStop = useCallback(() => {
    setHasStarted(false);
    setApeGameState("IDLE");
    gameWindowRef.current?.stop();
  }, []);

  const handleGameEnd = useCallback(
    (finalScore: number) => {
      setApeFinalScore(finalScore);
      setApeGameState("GAME_OVER");
      onGameEnd(finalScore);
    },
    [onGameEnd],
  );

  const handleAction = useCallback((action: "LONG" | "SHORT" | "CLOSE") => {
    setActionTick({ action, id: ++actionIdRef.current });
  }, []);

  const handlePnLUpdate = useCallback((realized: number, unrealized: number) => {
    setApePnL({ realized, unrealized });
  }, []);

  useImperativeHandle(ref, () => ({ stop: handleStop }), [handleStop]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        <div className="w-56 shrink-0">
          <ApeDisplay
            gameState={apeGameState}
            realizedPnL={apePnL.realized}
            unrealizedPnL={apePnL.unrealized}
            finalScore={apeFinalScore}
            actionTick={actionTick}
          />
        </div>
        <div className="min-w-0 flex-1">
          <GameWindow
            ref={gameWindowRef}
            onGameEnd={handleGameEnd}
            onAction={handleAction}
            onPnLUpdate={handlePnLUpdate}
          />
        </div>
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          className="rounded-lg bg-yellow-500 px-6 py-2 font-bold text-black shadow transition hover:bg-yellow-400"
        >
          {hasStarted ? "Play Again" : "Start Game"}
        </button>
      </div>
    </div>
  );
}
