import { createServerFn } from "@tanstack/react-start";
import { addTranscriptServer } from "./live.server";

export const addTranscriptFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { share_code: string; original_text: string; translations: Record<string, string> } }) => {
    return addTranscriptServer(data);
  }
);
