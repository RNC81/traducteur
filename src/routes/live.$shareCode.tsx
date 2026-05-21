import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { Radio } from "lucide-react";

export const Route = createFileRoute("/live/$shareCode")({ component: LivePage });

type TranscriptLine = {
  id: string;
  original_text: string;
  translations: Record<string, string>;
  is_final?: boolean;
  timestamp: string;
};

function LivePage() {
  const { shareCode } = Route.useParams();
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<{ original_text: string, translations: Record<string, string> } | null>(null);
  const [selectedLang, setSelectedLang] = useState("FR");
  const [sourceLang, setSourceLang] = useState("fr-FR");
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, interimTranscript]);

  useEffect(() => {
    // Fetch session info
    fetch(`/api/sessions/${shareCode}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.source_lang) setSourceLang(data.source_lang);
      })
      .catch(() => {});

    // Fetch history
    fetch(`/api/sessions/${shareCode}/transcripts`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTranscripts(data);
      })
      .catch(() => {});
    const eventSource = new EventSource(`/api/stream?share_code=${shareCode}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "connected") {
          setIsConnected(true);
        } else if (data.type === "interim") {
          setInterimTranscript({
            original_text: data.original_text,
            translations: data.translations || {}
          });
        } else if (data.id) {
          if (data.type === "final_draft" || data.type === "final_verified") {
            setInterimTranscript(null); // clear interim when final arrives
          }
          setTranscripts((prev) => {
            const index = prev.findIndex((t) => t.id === data.id);
            if (index >= 0) {
              const newArr = [...prev];
              newArr[index] = data;
              return newArr;
            }
            return [...prev, data];
          });
        }
      } catch (err) {
        // Ignore parsing errors from keep-alive
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
      <header className="flex h-16 items-center justify-between border-b border-border px-6 sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <Logo />
        <div className="flex items-center gap-4">
          <select 
            value={selectedLang} 
            onChange={(e) => setSelectedLang(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm"
          >
            <option value="FR">Français</option>
            <option value="AR">العربية</option>
            <option value="ORIGINAL">{sourceLang} (Original)</option>
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

      <main ref={scrollRef} className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-6 overflow-y-auto pb-32 scroll-smooth">
        <div className="flex-1 space-y-8">
          {transcripts.length === 0 && !interimTranscript ? (
            <div className="flex h-full items-center justify-center text-muted-foreground italic mt-20">
              {isConnected ? "Waiting for the speaker..." : "Connecting to stream..."}
            </div>
          ) : (
            transcripts.map((t) => (
              <div key={t.id} className="animate-in fade-in slide-in-from-bottom-2">
                <div className={`text-2xl font-medium leading-relaxed md:text-4xl transition-colors duration-500 ${t.is_final === false ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {selectedLang === "ORIGINAL" ? t.original_text : (t.translations?.[selectedLang] || <span className="italic text-muted-foreground">Traduction en cours...</span>)}
                  {t.is_final === false && (
                    <span className="ml-3 inline-block h-2 w-2 rounded-full bg-primary/40 animate-pulse align-middle" title="Vérification IA en cours..." />
                  )}
                </div>
              </div>
            ))
          )}
          
          {interimTranscript && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <div className="text-2xl font-medium leading-relaxed md:text-4xl text-muted-foreground/60 italic">
                {selectedLang === "ORIGINAL" ? interimTranscript.original_text : (interimTranscript.translations?.[selectedLang] || interimTranscript.original_text)}
                <span className="ml-2 animate-pulse">...</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
