import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

type UserRow = { username: string; highscore: string };

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ user: null });

  const { rows } = await pool.query<UserRow>(
    "SELECT username, highscore FROM users WHERE id = $1",
    [session.uid],
  );

  if (rows.length === 0) return Response.json({ user: null });

  return Response.json({
    user: {
      username: rows[0].username,
      highscore: Number(rows[0].highscore),
    },
  });
}
