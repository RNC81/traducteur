import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";

export const Route = createFileRoute("/overlay/$shareCode")({ component: OverlayPage });

type TranscriptLine = {
  id: string;
  original_text: string;
  translations: Record<string, string>;
  is_final?: boolean;
  timestamp: string;
};

function OverlayPage() {
  const { shareCode } = Route.useParams();
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<{ original_text: string, translations: Record<string, string> } | null>(null);
  
  // OBS usually loads the URL with ?lang=FR (defaulting to AR, EN, etc). 
  // For simplicity, we'll extract it from search params or default to FR.
  const [selectedLang, setSelectedLang] = useState("FR");
  const [sourceLang, setSourceLang] = useState("fr-FR");

  const [visible, setVisible] = useState(true);
  const hideTimeoutRef = useRef<any>(null);

  useEffect(() => {
    // Read the query string to determine the language for the overlay (default to FR)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("lang")) {
      setSelectedLang(urlParams.get("lang")!.toUpperCase());
    }

    // Fetch session info
    fetch(`/api/sessions/${shareCode}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.source_lang) setSourceLang(data.source_lang);
      })
      .catch(() => {});

    // For OBS overlay, we usually don't need history, but fetching it makes sure we can show the last spoken line if we reload.
    fetch(`/api/sessions/${shareCode}/transcripts`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTranscripts(data);
        resetHideTimeout();
      })
      .catch(() => {});

    const eventSource = new EventSource(`/api/stream?share_code=${shareCode}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "interim") {
          setInterimTranscript({
            original_text: data.original_text,
            translations: data.translations || {}
          });
          resetHideTimeout();
        } else if (data.id) {
          if (data.type === "final_draft" || data.type === "final_verified") {
            if (data.type === "final_draft" && interimTranscript) {
              data.translations = { ...interimTranscript.translations, ...(data.translations || {}) };
            }
            setInterimTranscript(null);
          }
          
          setTranscripts((prev) => {
            const index = prev.findIndex((t) => t.id === data.id);
            if (index >= 0) {
              data.translations = { ...prev[index].translations, ...(data.translations || {}) };
              const newArr = [...prev];
              newArr[index] = data;
              return newArr;
            }
            return [...prev, data];
          });
          resetHideTimeout();
        }
      } catch (err) {
        // Ignore keep-alive
      }
    };

    return () => {
      eventSource.close();
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [shareCode]);

  // Hide text after 10 seconds of silence
  const resetHideTimeout = () => {
    setVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 10000);
  };

  // Determine what to show: The interim, OR the very last final transcript.
  const displayItem = interimTranscript || (transcripts.length > 0 ? transcripts[transcripts.length - 1] : null);
  
  if (!displayItem) return null;

  let textToShow = displayItem.original_text;
  if (selectedLang !== "ORIGINAL") {
    textToShow = displayItem.translations?.[selectedLang] || displayItem.original_text;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-transparent flex flex-col justify-end pb-12 px-12 pointer-events-none">
      <div 
        className={`transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'} flex flex-col items-center w-full`}
      >
        <h1 
          className="text-[4rem] font-bold text-center leading-tight tracking-wide"
          style={{
            color: "white",
            WebkitTextStroke: "2px black",
            textShadow: "0px 4px 16px rgba(0,0,0,0.8)",
            fontFamily: "system-ui, -apple-system, sans-serif"
          }}
        >
          {textToShow}
        </h1>
      </div>
    </div>
  );
}
