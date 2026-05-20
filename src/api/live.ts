import { createServerFn } from "@tanstack/react-start";
import connectToDatabase from "../lib/db";
import Transcript from "../lib/models/Transcript";
import Session from "../lib/models/Session";
import { clients } from "./liveStore";
import { getUserFromToken } from "./auth";

export const addTranscriptFn = createServerFn({ method: "POST" }).handler(async ({ data }: { data: { share_code: string; original_text: string; translations: Record<string, string> } }) => {
  // Security: only the authenticated session owner can broadcast
  const user = await getUserFromToken();
  if (!user) throw new Error("Unauthorized: you must be logged in to broadcast.");

  await connectToDatabase();
  
  const session = await Session.findOne({ share_code: data.share_code });
  if (!session) throw new Error("Session not found");
  
  // Verify ownership
  if (session.owner.toString() !== user.id) {
    throw new Error("Forbidden: you do not own this session.");
  }

  const transcript = await Transcript.create({
    session_id: session._id,
    original_text: data.original_text,
    translations: data.translations,
  });

  // Notify all connected SSE clients for this session
  const sessionClients = clients.get(data.share_code);
  if (sessionClients) {
    const message = JSON.stringify({
      id: transcript._id.toString(),
      original_text: transcript.original_text,
      translations: transcript.translations,
      timestamp: transcript.timestamp,
    });
    sessionClients.forEach((send) => send(`data: ${message}\n\n`));
  }

  return { success: true };
});
