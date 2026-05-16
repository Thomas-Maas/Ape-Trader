import { pool } from "@/lib/db";

type Row = { username: string; highscore: string };

export async function GET() {
  const { rows } = await pool.query<Row>(
    "SELECT username, highscore FROM users ORDER BY highscore DESC LIMIT 20",
  );
  return Response.json({
    entries: rows.map((r) => ({
      username: r.username,
      highscore: Number(r.highscore),
    })),
  });
}
