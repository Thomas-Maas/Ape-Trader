import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { setSessionCookie, signSession } from "@/lib/auth";

type PgError = { code?: string };

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: unknown;
    password?: unknown;
  };
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (username.length < 3 || username.length > 32) {
    return Response.json(
      { error: "Username must be 3–32 characters" },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return Response.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query<{ id: number; username: string }>(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
      [username, passwordHash],
    );
    const user = rows[0];
    const token = await signSession({ uid: user.id, username: user.username });
    await setSessionCookie(token);
    return Response.json({ username: user.username, highscore: 0 });
  } catch (err) {
    if ((err as PgError).code === "23505") {
      return Response.json(
        { error: "Username already taken" },
        { status: 409 },
      );
    }
    throw err;
  }
}
