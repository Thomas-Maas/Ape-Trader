import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { fetchBtcCandles } from "@/utils/binance";
import { GAME_DURATION_S, GAME_BUFFER_S, INITIAL_VISIBLE } from "@/lib/gameConfig";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const candles = await fetchBtcCandles();
  const expiresAt = new Date(Date.now() + (GAME_DURATION_S + GAME_BUFFER_S) * 1000);

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO game_sessions (user_id, candles, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [session.uid, JSON.stringify(candles), expiresAt],
  );

  return Response.json({ sessionId: rows[0].id, candles: candles.slice(0, INITIAL_VISIBLE) });
}
