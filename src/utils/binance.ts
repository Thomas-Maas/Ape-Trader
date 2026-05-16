export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

const ENDPOINT =
  "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=150";

export async function fetchBtcCandles(): Promise<Candle[]> {
  const res = await fetch(ENDPOINT);
  if (!res.ok) {
    throw new Error(`Binance request failed: ${res.status}`);
  }

  const raw = (await res.json()) as unknown[][];

  return raw.map((k) => ({
    time: k[0] as number,
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
  }));
}
