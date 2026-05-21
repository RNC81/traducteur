import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Logo } from "@/components/Logo";
import { Mic, MicOff, Settings, Radio, MonitorPlay } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/translate")({ component: TranslatePage });

function TranslatePage() {
  const navigate = useNavigate();
  const [isLive, setIsLive] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");
  const [finalTexts, setFinalTexts] = useState<{ id: number; text: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const isLiveRef = useRef(false);

  const interimRef = useRef("");
  const lastSentInterimRef = useRef("");
  const [context, setContext] = useState("");
  const [sourceLang, setSourceLang] = useState("fr-FR");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(({ user }) => { if (!user) navigate({ to: "/auth" }); })
      .catch(() => navigate({ to: "/auth" }));
  }, [navigate]);

  const copyOBSLink = () => {
    if (!shareCode) return;
    const url = `${window.location.origin}/overlay/${shareCode}?lang=FR`;
    navigator.clipboard.writeText(url);
    toast.success("Lien Régie (OBS) copié !");
  };

  const toggleLive = async () => {
    if (isLive) {
      recognitionRef.current?.stop();
      if ((window as any).interimInterval) clearInterval((window as any).interimInterval);
      isLiveRef.current = false;
      setIsLive(false);
      toast.success("Session terminée.");
      navigate({ to: "/dashboard" });
      return;
    }

    let newCode = "";
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: "Session Live", 
          mode: "live",
          source_lang: sourceLang,
          context: context
        }),
      });
      if (!res.ok) throw new Error("Erreur de création de session");
      const data = await res.json();
      newCode = data.share_code;
      setShareCode(newCode);
      setIsLive(true);
      isLiveRef.current = true;
    } catch (e: any) {
      toast.error(e.message || "Impossible de démarrer la session.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Votre navigateur ne supporte pas la reconnaissance vocale. Essayez Chrome ou Safari.");
      setIsLive(false);
      isLiveRef.current = false;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sourceLang;

    // Send interim text every 800ms to avoid flooding the API
    (window as any).interimInterval = setInterval(() => {
      const current = interimRef.current;
      if (current && current !== lastSentInterimRef.current) {
        lastSentInterimRef.current = current;
        fetch("/api/transcripts/interim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ share_code: newCode, original_text: current }),
        }).catch(() => {});
      }
    }, 800);

    recognition.onresult = async (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      interimRef.current = interim;
      setInterimText(interim);
      
      if (final) {
        interimRef.current = ""; // Clear interim when final triggers
        setFinalTexts((prev) => [...prev, { id: Date.now(), text: final }]);
        try {
          await fetch("/api/transcripts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ share_code: newCode, original_text: final }),
          });
        } catch (e) {
          console.error("Failed to send transcript", e);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Accès au microphone refusé. Vérifiez les paramètres de confidentialité de votre ordinateur/navigateur.");
        setIsLive(false);
        isLiveRef.current = false;
      } else if (event.error === "audio-capture") {
        toast.error("Aucun microphone détecté ou le micro est utilisé par une autre application.");
        setIsLive(false);
        isLiveRef.current = false;
      } else if (event.error === "network") {
        toast.error("Erreur réseau avec les serveurs de reconnaissance vocale.");
      }
    };

    recognition.onend = () => {
      if (isLiveRef.current) {
        recognition.start();
      } else {
        if ((window as any).interimInterval) clearInterval((window as any).interimInterval);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Logo />
        <div className="flex items-center gap-4">
          {shareCode && (
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm">
              <span className="text-muted-foreground">Lien audience :</span>
              <a
                href={`/live/${shareCode}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono font-medium hover:underline"
              >
                /live/{shareCode}
              </a>
              <button 
                onClick={copyOBSLink}
                className="ml-2 rounded-md bg-emerald-500/10 p-1.5 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                title="Copier le lien Régie (OBS)"
              >
                <MonitorPlay className="h-4 w-4" />
              </button>
            </div>
          )}
          <button className="rounded-md border border-border p-2 hover:bg-accent">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-6">
        {isLive ? (
          <div className="flex flex-col items-center">
            <div className="mb-8 flex items-center justify-center rounded-full bg-red-500/10 p-6 shadow-2xl shadow-red-500/20">
              <Radio className="h-16 w-16 animate-pulse text-red-500" />
            </div>
            <h2 className="text-2xl font-medium">Vous êtes en direct</h2>
            <p className="mt-2 max-w-md text-center text-muted-foreground">
              Parlez naturellement. Votre audience reçoit les traductions en temps réel.
            </p>
          </div>
        ) : (
          <div className="flex w-full max-w-md flex-col items-center rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-center rounded-full bg-primary/10 p-5">
              <Mic className="h-12 w-12 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-medium">Configurer la session</h2>
            
            <div className="mt-6 w-full space-y-4 text-left">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Langue parlée</label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="fr-FR">Français</option>
                  <option value="en-US">Anglais</option>
                  <option value="ar-SA">Arabe</option>
                  <option value="fa-IR">Farsi / Perse</option>
                  <option value="ur-PK">Ourdou (Urdu)</option>
                  <option value="hi-IN">Hindi</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Contexte <span className="text-muted-foreground font-normal">(Optionnel)</span>
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Ex: Khutbah sur l'importance du mois de Ramadan et l'Imam Ali..."
                  className="h-24 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Aide l'IA à comprendre les termes techniques ou théologiques.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 w-full max-w-2xl">
          <div className="min-h-[200px] rounded-xl border border-border bg-card p-6">
            {finalTexts.map((t) => (
              <p key={t.id} className="mb-2 text-lg text-foreground">{t.text}</p>
            ))}
            <p className="text-lg italic text-muted-foreground">{interimText}</p>
          </div>
        </div>
      </main>

      <footer className="flex justify-center border-t border-border bg-background p-4">
        <button
          onClick={toggleLive}
          className={`flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium text-white shadow-xl transition-transform hover:scale-105 active:scale-95 ${
            isLive
              ? "bg-red-500 shadow-red-500/20 hover:bg-red-600"
              : "bg-primary shadow-primary/20 hover:bg-primary/90"
          }`}
        >
          {isLive ? (
            <><MicOff className="h-5 w-5" /> Arrêter la session</>
          ) : (
            <><Mic className="h-5 w-5" /> Commencer à parler</>
          )}
        </button>
      </footer>
    </div>
  );
}
