"use client";

import {
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import GameWindow, { type GameWindowHandle } from "./GameWindow";

export type GameViewHandle = {
  stop: () => void;
};

type Props = {
  ref?: Ref<GameViewHandle>;
  onGameEnd: () => void;
};

export default function GameView({ ref, onGameEnd }: Props) {
  const gameWindowRef = useRef<GameWindowHandle>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = useCallback(() => {
    setHasStarted(true);
    gameWindowRef.current?.start();
  }, []);

  const handleStop = useCallback(() => {
    setHasStarted(false);
    gameWindowRef.current?.stop();
  }, []);

  useImperativeHandle(ref, () => ({ stop: handleStop }), [handleStop]);

  return (
    <div className="space-y-4">
      <GameWindow ref={gameWindowRef} onGameEnd={onGameEnd} />
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
