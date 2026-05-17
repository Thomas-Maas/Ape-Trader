import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { computeScore, type GameAction } from "@/lib/game";
import type { Candle } from "@/utils/binance";
import { DRIP_SPEED_MS, INITIAL_VISIBLE } from "@/lib/gameConfig";

type SessionRow = {
  user_id: number;
  candles: Candle[];
  actions: GameAction[];
  started_at: string;
  expires_at: string;
  ended_at: string | null;
};

type HighscoreRow = { highscore: string };

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = (await request.json()) as { sessionId?: unknown };
  const { sessionId } = body;

  if (typeof sessionId !== "string") {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { rows } = await pool.query<SessionRow>(
    `SELECT user_id, candles, actions, started_at, expires_at, ended_at
     FROM game_sessions WHERE id = $1`,
    [sessionId],
  );

  const row = rows[0];
  if (!row) return Response.json({ error: "Session not found" }, { status: 404 });
  if (row.user_id !== session.uid) return Response.json({ error: "Forbidden" }, { status: 403 });
  if (row.ended_at) return Response.json({ error: "Game already ended" }, { status: 400 });

  const elapsedMs = Date.now() - new Date(row.started_at).getTime();
  const finalCandleIndex = Math.min(
    INITIAL_VISIBLE + Math.floor(elapsedMs / DRIP_SPEED_MS),
    row.candles.length - 1,
  );
  const score = computeScore(row.candles, row.actions ?? [], finalCandleIndex);

  const { rows: hsRows } = await pool.query<HighscoreRow>(
    `UPDATE users SET highscore = GREATEST(highscore, $1) WHERE id = $2 RETURNING highscore`,
    [score, session.uid],
  );

  await pool.query(
    `UPDATE game_sessions SET score = $1, ended_at = now() WHERE id = $2`,
    [score, sessionId],
  );

  return Response.json({ score, highscore: Number(hsRows[0].highscore) });
}
