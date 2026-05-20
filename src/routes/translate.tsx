import { createFileRoute, useNavigate } from "@tanstack/react-start";
import { useEffect, useState, useRef } from "react";
import { getSessionFn } from "@/server/auth";
import { addTranscriptFn } from "@/server/live";
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

  useEffect(() => {
    getSessionFn().then(({ user }) => {
      if (!user) navigate({ to: "/auth" });
    });
  }, [navigate]);

  const toggleLive = async () => {
    if (isLive) {
      // Stop logic
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsLive(false);
      toast.success("Session ended.");
      navigate({ to: "/dashboard" });
      return;
    }

    // Start logic
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setShareCode(code);
    setIsLive(true);
    
    // Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Your browser does not support Speech Recognition. Try Chrome or Safari.");
      setIsLive(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; // Hardcoded for now

    recognition.onresult = async (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimText(interim);
      if (final) {
        setFinalTexts((prev) => [...prev, { id: Date.now(), text: final }]);
        
        // Mock translation
        const translations = {
          "FR": "Traduction simulée: " + final,
          "AR": "ترجمة وهمية: " + final
        };

        try {
          await addTranscriptFn({
            data: {
              share_code: code,
              original_text: final,
              translations,
            }
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
      if (isLive) {
        // Restart if it stops automatically
        recognition.start();
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
              <span className="text-muted-foreground">Listener link:</span>
              <a href={`/live/${shareCode}`} target="_blank" rel="noreferrer" className="font-mono font-medium hover:underline">
                verba.app/live/{shareCode}
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
            <h2 className="text-2xl font-medium">You are live</h2>
            <p className="mt-2 text-muted-foreground text-center max-w-md">
              Speak naturally. Your audience is receiving real-time translations.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-8 flex items-center justify-center rounded-full bg-primary/10 p-6">
              <Mic className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-2xl font-medium">Ready to start?</h2>
            <p className="mt-2 text-muted-foreground">Start speaking to broadcast translations.</p>
          </div>
        )}

        <div className="mt-12 w-full max-w-2xl">
          <div className="rounded-xl border border-border bg-card p-6 min-h-[200px]">
            {finalTexts.map((t) => (
              <p key={t.id} className="mb-2 text-lg text-foreground">{t.text}</p>
            ))}
            <p className="text-lg text-muted-foreground italic">{interimText}</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-background p-4 flex justify-center">
        <button
          onClick={toggleLive}
          className={`flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium text-white shadow-xl transition-transform hover:scale-105 active:scale-95 ${
            isLive ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"
          }`}
        >
          {isLive ? (
            <><MicOff className="h-5 w-5" /> Stop session</>
          ) : (
            <><Mic className="h-5 w-5" /> Start speaking</>
          )}
        </button>
      </footer>
    </div>
  );
}
