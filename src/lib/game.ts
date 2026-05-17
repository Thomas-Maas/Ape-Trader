import type { Candle } from "@/utils/binance";

export type ActionType = "LONG" | "SHORT" | "CLOSE";

export type GameAction = {
  action: ActionType;
  candleIndex: number;
};

export function computeScore(candles: Candle[], actions: GameAction[], finalCandleIndex: number): number {
  let realized = 0;
  let position: { type: "LONG" | "SHORT"; entryPrice: number } | null = null;

  for (const { action, candleIndex } of actions) {
    const price = candles[candleIndex]?.close;
    if (price === undefined) continue;

    if (action === "LONG" || action === "SHORT") {
      if (position) {
        realized += pnlFor(position.type, position.entryPrice, price);
      }
      position = { type: action, entryPrice: price };
    } else if (action === "CLOSE" && position) {
      realized += pnlFor(position.type, position.entryPrice, price);
      position = null;
    }
  }

  // Auto-close any open position at the final visible candle
  if (position !== null) {
    const finalPrice = candles[finalCandleIndex]?.close;
    if (finalPrice !== undefined) {
      realized += pnlFor(position.type, position.entryPrice, finalPrice);
    }
  }

  return realized;
}

function pnlFor(type: "LONG" | "SHORT", entryPrice: number, exitPrice: number): number {
  return type === "LONG" ? exitPrice - entryPrice : entryPrice - exitPrice;
}
