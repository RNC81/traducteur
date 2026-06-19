import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";

export const Route = createFileRoute("/display/$shareCode")({ component: DisplayPage });

type TranscriptLine = {
  id: string;
  original_text: string;
  translations: Record<string, string>;
  is_final?: boolean;
  timestamp: string;
};

const LANGS = [
  { code: "FR", label: "Français" },
  { code: "EN", label: "English" },
  { code: "AR", label: "العربية" },
  { code: "FA", label: "فارسی" },
  { code: "UR", label: "اردو" },
  { code: "HI", label: "हिन्दी" },
  { code: "TR", label: "Türkçe" },
  { code: "DE", label: "Deutsch" },
  { code: "ES", label: "Español" },
  { code: "PT", label: "Português" },
];

function DisplayPage() {
  const { shareCode } = Route.useParams();
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<{ original_text: string; translations: Record<string, string> } | null>(null);
  const [selectedLang, setSelectedLang] = useState("FR");
  const [visible, setVisible] = useState(true);
  const [showSelector, setShowSelector] = useState(true);
  const hideTimeoutRef = useRef<any>(null);
  const selectorTimeoutRef = useRef<any>(null);

  const resetHideTimeout = () => {
    setVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setVisible(false), 10000);
  };

  const resetSelectorTimeout = () => {
    setShowSelector(true);
    if (selectorTimeoutRef.current) clearTimeout(selectorTimeoutRef.current);
    selectorTimeoutRef.current = setTimeout(() => setShowSelector(false), 3000);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get("lang")?.toUpperCase() || "FR";
    setSelectedLang(lang);

    fetch(`/api/sessions/${shareCode}/transcripts`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTranscripts(data); })
      .catch(() => {});

    const eventSource = new EventSource(`/api/stream?share_code=${shareCode}&lang=${lang}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "interim") {
          setInterimTranscript({ original_text: data.original_text, translations: data.translations || {} });
          resetHideTimeout();
        } else if (data.id) {
          if (data.type === "final_draft" || data.type === "final_verified") {
            setInterimTranscript(null);
          }
          setTranscripts((prev) => {
            const index = prev.findIndex((t) => t.id === data.id);
            if (index >= 0) {
              const newArr = [...prev];
              newArr[index] = { ...prev[index], ...data, translations: { ...prev[index].translations, ...(data.translations || {}) } };
              return newArr;
            }
            return [...prev, data];
          });
          resetHideTimeout();
        }
      } catch { /* keep-alive */ }
    };

    resetSelectorTimeout();

    return () => {
      eventSource.close();
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (selectorTimeoutRef.current) clearTimeout(selectorTimeoutRef.current);
    };
  }, [shareCode]);

  const displayItem = interimTranscript || (transcripts.length > 0 ? transcripts[transcripts.length - 1] : null);
  const textToShow = selectedLang === "ORIGINAL"
    ? displayItem?.original_text
    : displayItem?.translations?.[selectedLang] || displayItem?.original_text;

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden"
      onMouseMove={resetSelectorTimeout}
      onTouchStart={resetSelectorTimeout}
    >
      <div className={`transition-opacity duration-1000 px-12 w-full flex items-center justify-center ${visible && textToShow ? "opacity-100" : "opacity-0"}`}>
        <p className="text-white text-6xl font-bold text-center leading-tight tracking-wide max-w-5xl"
          style={{ textShadow: "0 2px 30px rgba(0,0,0,0.8)" }}>
          {textToShow}
        </p>
      </div>

      <div className={`absolute bottom-8 flex justify-center transition-opacity duration-500 ${showSelector ? "opacity-100" : "opacity-0"}`}>
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="bg-white/10 text-white/70 text-sm rounded-md px-3 py-1.5 border border-white/20 focus:outline-none backdrop-blur-sm cursor-pointer"
        >
          {LANGS.map(l => (
            <option key={l.code} value={l.code} className="bg-black text-white">{l.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
