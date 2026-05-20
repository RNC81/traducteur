import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/live/$shareCode")({ component: LivePage });

type TranscriptLine = {
  id: string;
  original_text: string;
  translations: Record<string, string>;
  timestamp: string;
};

function LivePage() {
  const { shareCode } = Route.useParams();
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [selectedLang, setSelectedLang] = useState("FR");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`/api/stream?share_code=${shareCode}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "connected") {
          setIsConnected(true);
        } else if (data.id) {
          setTranscripts((prev) => [...prev, data]);
          // Auto-scroll logic could go here
        }
      } catch (err) {
        // Ignore keep-alive comments which don't trigger onmessage anyway,
        // but catch any malformed JSON just in case.
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error", err);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [shareCode]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Logo />
        <div className="flex items-center gap-4">
          <select 
            value={selectedLang} 
            onChange={(e) => setSelectedLang(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
          >
            <option value="FR">Français</option>
            <option value="AR">العربية</option>
            <option value="EN">English (Original)</option>
          </select>
          <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs">
            {isConnected ? (
              <><Radio className="h-3 w-3 text-red-500 animate-pulse" /> Live</>
            ) : (
              <><div className="h-2 w-2 rounded-full bg-muted-foreground" /> Reconnecting...</>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-6">
        <div className="flex-1 space-y-6">
          {transcripts.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground italic">
              {isConnected ? "Waiting for speaker..." : "Connecting to stream..."}
            </div>
          ) : (
            transcripts.map((t) => (
              <div key={t.id} className="animate-in fade-in slide-in-from-bottom-2">
                <div className="text-2xl font-medium leading-relaxed md:text-4xl text-foreground">
                  {selectedLang === "EN" ? t.original_text : t.translations[selectedLang]}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
