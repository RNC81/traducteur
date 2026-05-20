import { createServerFn } from "@tanstack/react-start";
import connectToDatabase from "../lib/db";
import Session from "../lib/models/Session";
import { getUserFromToken } from "./auth.server";

export const getSessionsFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getUserFromToken();
  if (!user) throw new Error("Unauthorized");

  await connectToDatabase();
  const sessions = await Session.find({ owner: user.id })
    .sort({ started_at: -1 })
    .limit(20)
    .lean();

  return sessions.map((s) => ({
    id: (s._id as any).toString(),
    title: (s as any).title as string,
    source_lang: s.source_lang as string,
    target_langs: s.target_langs as string[],
    mode: s.mode as string,
    is_live: s.is_live as boolean,
    started_at: (s.started_at as Date).toISOString(),
    ended_at: s.ended_at ? (s.ended_at as Date).toISOString() : null,
  }));
});
