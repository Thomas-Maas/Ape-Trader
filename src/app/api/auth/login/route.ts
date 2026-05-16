import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { setSessionCookie, signSession } from "@/lib/auth";

type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  highscore: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: unknown;
    password?: unknown;
  };
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !password) {
    return Response.json({ error: "Missing credentials" }, { status: 400 });
  }

  const { rows } = await pool.query<UserRow>(
    "SELECT id, username, password_hash, highscore FROM users WHERE username = $1",
    [username],
  );

  if (rows.length === 0) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signSession({ uid: user.id, username: user.username });
  await setSessionCookie(token);
  return Response.json({
    username: user.username,
    highscore: Number(user.highscore),
  });
}
