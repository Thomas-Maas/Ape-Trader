import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { DRIP_SPEED_MS, INITIAL_VISIBLE } from "@/lib/gameConfig";
import type { Candle } from "@/utils/binance";

type SessionRow = {
  user_id: number;
  candles: Candle[];
  started_at: string;
  expires_at: string;
  ended_at: string | null;
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return Response.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const { rows } = await pool.query<SessionRow>(
    `SELECT user_id, candles, started_at, expires_at, ended_at
     FROM game_sessions WHERE id = $1`,
    [sessionId],
  );

  const row = rows[0];
  if (!row) return Response.json({ error: "Session not found" }, { status: 404 });
  if (row.user_id !== session.uid) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (row.ended_at || new Date(row.expires_at) < new Date()) {
    return Response.json({ candle: null });
  }

  const elapsedMs = Date.now() - new Date(row.started_at).getTime();
  const nextIndex = INITIAL_VISIBLE + Math.floor(elapsedMs / DRIP_SPEED_MS);

  if (nextIndex >= row.candles.length) {
    return Response.json({ candle: null });
  }

  return Response.json({ candle: row.candles[nextIndex], index: nextIndex });
}
