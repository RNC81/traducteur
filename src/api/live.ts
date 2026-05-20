import { createServerFn } from "@tanstack/react-start";
import connectToDatabase from "../lib/db";
import Transcript from "../lib/models/Transcript";
import Session from "../lib/models/Session";
import { clients } from "./liveStore";

export const addTranscriptFn = createServerFn({ method: "POST" }).handler(async ({ data }: { data: { share_code: string; original_text: string; translations: Record<string, string> } }) => {
  await connectToDatabase();
  
  const session = await Session.findOne({ share_code: data.share_code });
  if (!session) throw new Error("Session not found");

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
