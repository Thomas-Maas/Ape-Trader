import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { GameAction } from "@/lib/game";
import { DRIP_SPEED_MS, INITIAL_VISIBLE } from "@/lib/gameConfig";

type SessionRow = {
  user_id: number;
  candles: unknown[];
  actions: GameAction[];
  started_at: string;
  expires_at: string;
  ended_at: string | null;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = (await request.json()) as {
    sessionId?: unknown;
    action?: unknown;
    candleIndex?: unknown;
  };

  const { sessionId, action, candleIndex } = body;

  if (
    typeof sessionId !== "string" ||
    (action !== "LONG" && action !== "SHORT" && action !== "CLOSE") ||
    typeof candleIndex !== "number" ||
    !Number.isInteger(candleIndex) ||
    candleIndex < 0
  ) {
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
  if (new Date(row.expires_at) < new Date()) {
    return Response.json({ error: "Session expired" }, { status: 400 });
  }
  if (candleIndex >= (row.candles as unknown[]).length) {
    return Response.json({ error: "Candle index out of bounds" }, { status: 400 });
  }

  // Reject if candle wasn't visible yet — prevents drip-speed manipulation
  const elapsedMs = Date.now() - new Date(row.started_at).getTime();
  const maxVisibleIndex = INITIAL_VISIBLE + Math.floor(elapsedMs / DRIP_SPEED_MS);
  if (candleIndex > maxVisibleIndex) {
    return Response.json({ error: "Candle not yet visible" }, { status: 400 });
  }

  // Validate action legality against current state
  const currentActions: GameAction[] = row.actions ?? [];
  const hasPosition = (() => {
    let open = false;
    for (const a of currentActions) {
      if (a.action === "LONG" || a.action === "SHORT") open = true;
      else if (a.action === "CLOSE") open = false;
    }
    return open;
  })();

  if (action === "CLOSE" && !hasPosition) {
    return Response.json({ error: "No open position to close" }, { status: 400 });
  }

  const newActions: GameAction[] = [...currentActions, { action, candleIndex }];

  await pool.query(
    `UPDATE game_sessions SET actions = $1 WHERE id = $2`,
    [JSON.stringify(newActions), sessionId],
  );

  return Response.json({ ok: true });
}
