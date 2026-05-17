export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

// Kraken public OHLC — no API key, accessible from Vercel servers
// interval=1 → 1-minute candles; returns up to 720 candles
const ENDPOINT = "https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1";

type KrakenResponse = {
  error: string[];
  result: Record<string, [number, string, string, string, string, string, string, number][]>;
};

export async function fetchBtcCandles(): Promise<Candle[]> {
  const res = await fetch(ENDPOINT, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Kraken request failed: ${res.status}`);
  }

  const json = (await res.json()) as KrakenResponse;
  if (json.error?.length > 0) {
    throw new Error(`Kraken error: ${json.error.join(", ")}`);
  }

  // result has one pair key + a "last" cursor key; grab the pair
  const pairKey = Object.keys(json.result).find((k) => k !== "last")!;
  const raw = json.result[pairKey];

  // Kraken timestamps are in seconds; multiply by 1000 to match Binance ms format
  return raw.map((k) => ({
    time: k[0] * 1000,
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
  }));
}
