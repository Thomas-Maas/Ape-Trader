export type PositionType = "LONG" | "SHORT";
export type Position = { type: PositionType; entryPrice: number };

type Props = {
  position: Position | null;
  canOpen: boolean;
  onOpen: (type: PositionType) => void;
  onClose: () => void;
};

export default function TradeControls({
  position,
  canOpen,
  onOpen,
  onClose,
}: Props) {
  return (
    <div className="flex w-36 flex-col gap-3">
      {position === null ? (
        <>
          <button
            onClick={() => onOpen("LONG")}
            disabled={!canOpen}
            className="rounded-lg bg-green-600 px-4 py-3 font-bold text-white shadow transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Long
          </button>
          <button
            onClick={() => onOpen("SHORT")}
            disabled={!canOpen}
            className="rounded-lg bg-red-600 px-4 py-3 font-bold text-white shadow transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Short
          </button>
        </>
      ) : (
        <button
          onClick={onClose}
          className="rounded-lg bg-amber-500 px-4 py-3 font-bold text-black shadow transition hover:bg-amber-400"
        >
          Close Position
        </button>
      )}

      {position && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-3 text-xs">
          <div className="text-gray-400">Position</div>
          <div
            className={
              position.type === "LONG" ? "text-green-400" : "text-red-400"
            }
          >
            {position.type}
          </div>
          <div className="mt-2 text-gray-400">Entry</div>
          <div className="font-mono text-white">
            ${position.entryPrice.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
