type Props = {
  realizedPnL: number;
  unrealizedPnL: number;
};

function colorFor(value: number) {
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-gray-300";
}

function format(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

export default function ProfitDisplay({ realizedPnL, unrealizedPnL }: Props) {
  return (
    <div className="flex w-full gap-4">
      <div className="flex-1 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <div className="text-xs uppercase tracking-wide text-gray-400">
          Realized
        </div>
        <div className={`mt-1 font-mono text-2xl ${colorFor(realizedPnL)}`}>
          {format(realizedPnL)}
        </div>
      </div>
      <div className="flex-1 rounded-lg border border-gray-700 bg-gray-800 p-4">
        <div className="text-xs uppercase tracking-wide text-gray-400">
          Unrealized
        </div>
        <div className={`mt-1 font-mono text-2xl ${colorFor(unrealizedPnL)}`}>
          {format(unrealizedPnL)}
        </div>
      </div>
    </div>
  );
}
