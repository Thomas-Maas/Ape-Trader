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
    <div className="flex w-full gap-3">
      {position === null ? (
        <>
          <button
            onClick={() => onOpen("LONG")}
            disabled={!canOpen}
            className="flex-1 rounded-lg border border-green-400 bg-green-600 px-4 py-4 text-lg font-bold text-white shadow transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Long
          </button>
          <button
            onClick={() => onOpen("SHORT")}
            disabled={!canOpen}
            className="flex-1 rounded-lg border border-red-400 bg-red-600 px-4 py-4 text-lg font-bold text-white shadow transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Short
          </button>
        </>
      ) : (
        <button
          onClick={onClose}
          className="w-full rounded-lg border border-yellow-300 bg-yellow-500 px-4 py-4 text-lg font-bold text-black shadow transition hover:bg-yellow-400"
        >
          Close
        </button>
      )}
    </div>
  );
}
