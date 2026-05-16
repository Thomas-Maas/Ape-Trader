import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

type ScoreRow = { highscore: string };

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = (await request.json()) as { score?: unknown };
  const score = typeof body.score === "number" ? body.score : NaN;

  if (!Number.isFinite(score)) {
    return Response.json({ error: "Invalid score" }, { status: 400 });
  }

  const { rows } = await pool.query<ScoreRow>(
    "UPDATE users SET highscore = GREATEST(highscore, $1) WHERE id = $2 RETURNING highscore",
    [score, session.uid],
  );

  return Response.json({ highscore: Number(rows[0].highscore) });
}
