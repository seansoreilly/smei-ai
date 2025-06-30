import { db } from './db';

const SESSION_DURATION_IN_SECONDS = 60 * 60 * 24; // 24 hours

export async function getSession(sessionId: string) {
  const rows = await db`SELECT * FROM sessions WHERE id = ${sessionId} AND expires_at > NOW()`;
  return rows[0] || null;
}

export async function createSession(userId: string) {
  const sessionId = crypto.randomUUID();
  const rows = await db`INSERT INTO sessions (id, user_id, expires_at) VALUES (${sessionId}, ${userId}, NOW() + INTERVAL '${SESSION_DURATION_IN_SECONDS} seconds') RETURNING *`;
  return rows[0];
}

export async function deleteSession(sessionId: string) {
  await db`DELETE FROM sessions WHERE id = ${sessionId}`;
}
