import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Logo } from "@/components/Logo";
import { Mic, MicOff, Settings, Radio, MonitorPlay, QrCode, Monitor } from "lucide-react";
import { toast } from "sonner";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

export const Route = createFileRoute("/translate")({ component: TranslatePage });

function TranslatePage() {
  const navigate = useNavigate();
  const [isLive, setIsLive] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const [interimText, setInterimText] = useState("");
  const [finalTexts, setFinalTexts] = useState<{ id: number; text: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const isLiveRef = useRef(false);

  const interimRef = useRef("");
  const lastSentInterimRef = useRef("");
  const [context, setContext] = useState("");
  const [sourceLang, setSourceLang] = useState("fr");
  const [obsLang, setObsLang] = useState("fr");
  const [displayLang, setDisplayLang] = useState("fr");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(({ user }) => { if (!user) navigate({ to: "/auth" }); })
      .catch(() => navigate({ to: "/auth" }));
  }, [navigate]);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = (canvas as HTMLCanvasElement).toDataURL("image/png");
    a.download = `verba-qr-${shareCode}.png`;
    a.click();
  };

  const copyOBSLink = () => {
    if (!shareCode) return;
    const url = `${window.location.origin}/overlay/${shareCode}?lang=${obsLang.toUpperCase()}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien Régie (OBS) copié !");
  };

  const copyDisplayLink = () => {
    if (!shareCode) return;
    const url = `${window.location.origin}/display/${shareCode}?lang=${displayLang.toUpperCase()}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien Écran copié !");
  };

  const toggleLive = async () => {
    if (isLive) {
      recognitionRef.current?.stop();
      if ((window as any).interimInterval) clearInterval((window as any).interimInterval);
      isLiveRef.current = false;
      setIsLive(false);
      if (sessionId) {
        fetch(`/api/sessions/${sessionId}`, { method: "PATCH" }).catch(() => {});
      }
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
      setSessionId(data.id);
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
              <select
                value={obsLang}
                onChange={(e) => setObsLang(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none"
                title="Langue Régie (OBS)"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              <button
                onClick={copyOBSLink}
                className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                title="Copier le lien Régie (OBS)"
              >
                <MonitorPlay className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowQR(true)}
                className="rounded-md bg-primary/10 p-1.5 text-primary hover:bg-primary/20 transition-colors"
                title="Afficher le QR Code audience"
              >
                <QrCode className="h-4 w-4" />
              </button>
              <select
                value={displayLang}
                onChange={(e) => setDisplayLang(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none"
                title="Langue Écran"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              <button
                onClick={copyDisplayLink}
                className="rounded-md bg-violet-500/10 p-1.5 text-violet-500 hover:bg-violet-500/20 transition-colors"
                title="Copier le lien Écran (vidéoprojecteur)"
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>
          )}
          <button className="rounded-md border border-border p-2 hover:bg-accent">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {showQR && shareCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowQR(false)}>
          <div className="rounded-2xl bg-card border border-border p-8 shadow-2xl flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-xl">QR Code Audience</h2>
            <p className="text-sm text-muted-foreground">Scannez pour rejoindre la traduction en direct</p>
            <div ref={qrRef}>
              <QRCodeCanvas value={`${window.location.origin}/live/${shareCode}`} size={256} />
            </div>
            <div className="flex gap-3">
              <button onClick={downloadQR} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent transition-colors">
                Télécharger PNG
              </button>
              <button onClick={() => setShowQR(false)} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
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
