import { createServerFn } from "@tanstack/react-start";
import connectToDatabase from "../lib/db";
import Session from "../lib/models/Session";
import { getUserFromToken } from "./auth";

export const getSessionsFn = createServerFn("GET", async () => {
  const user = await getUserFromToken();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await connectToDatabase();
  const sessions = await Session.find({ owner: user.id })
    .sort({ started_at: -1 })
    .limit(20)
    .lean();

  return sessions.map((s) => ({
    id: s._id.toString(),
    title: s.title,
    source_lang: s.source_lang,
    target_langs: s.target_langs,
    mode: s.mode,
    is_live: s.is_live,
    started_at: s.started_at.toISOString(),
    ended_at: s.ended_at ? s.ended_at.toISOString() : null,
  }));
});
