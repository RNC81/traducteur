import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Logo } from "@/components/Logo";
import { Mic, MicOff, Settings, Radio } from "lucide-react";
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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(({ user }) => { if (!user) navigate({ to: "/auth" }); })
      .catch(() => navigate({ to: "/auth" }));
  }, [navigate]);

  const toggleLive = async () => {
    if (isLive) {
      recognitionRef.current?.stop();
      isLiveRef.current = false;
      setIsLive(false);
      toast.success("Session terminée.");
      navigate({ to: "/dashboard" });
      return;
    }

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setShareCode(code);
    setIsLive(true);
    isLiveRef.current = true;

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
    recognition.lang = "fr-FR";

    recognition.onresult = async (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      setInterimText(interim);
      if (final) {
        setFinalTexts((prev) => [...prev, { id: Date.now(), text: final }]);
        const translations = {
          FR: "Traduction simulée : " + final,
          AR: "ترجمة وهمية: " + final,
        };
        try {
          await fetch("/api/transcripts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ share_code: code, original_text: final, translations }),
          });
        } catch (e) {
          console.error("Failed to send transcript", e);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
    };

    recognition.onend = () => {
      if (isLiveRef.current) recognition.start();
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
          <div className="flex flex-col items-center">
            <div className="mb-8 flex items-center justify-center rounded-full bg-primary/10 p-6">
              <Mic className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-2xl font-medium">Prêt à démarrer ?</h2>
            <p className="mt-2 text-muted-foreground">Commencez à parler pour diffuser les traductions.</p>
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
