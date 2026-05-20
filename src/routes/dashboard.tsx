import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSessionFn, signOutFn } from "@/api/auth";
import { getSessionsFn } from "@/api/sessions";
import { Logo } from "@/components/Logo";
import { LogOut, Mic, Sparkles, Radio, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

type SessionRow = {
  id: string;
  title: string;
  source_lang: string;
  target_langs: string[];
  mode: string;
  is_live: boolean;
  started_at: string;
  ended_at: string | null;
};

function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const { user } = await getSessionFn();
        if (!user) {
          navigate({ to: "/auth" });
          return;
        }
        setEmail(user.email);
        
        const rows = await getSessionsFn();
        setSessions(rows as SessionRow[]);
      } catch (err) {
        navigate({ to: "/auth" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  const signOut = async () => {
    await signOutFn();
    navigate({ to: "/" });
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-4xl">Welcome back.</h1>
        <p className="mt-2 text-muted-foreground">Start a live session or open Faith Mode for religious content.</p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <ActionCard to="/translate" icon={<Mic className="h-5 w-5" />} title="New live session" desc="Translate your voice in real time to 80+ languages." cta="Start session" />
          <ActionCard to="/translate" search={{ faith: "1" }} icon={<Sparkles className="h-5 w-5" />} title="Faith Mode" desc="Dedicated mode for khutbahs and Shia religious content." cta="Open Faith Mode" accent />
        </div>

        <div className="mt-12">
          <h2 className="font-display text-2xl">Recent sessions</h2>
          {sessions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              You haven't run any sessions yet. Start your first one above.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link to="/sessions/$id" params={{ id: s.id }} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-accent">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{s.title}</span>
                        {s.is_live && <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-600"><Radio className="h-2.5 w-2.5 animate-pulse" /> Live</span>}
                        {s.mode === "faith" && <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-700">Faith</span>}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {new Date(s.started_at).toLocaleString()} · {s.source_lang} → {s.target_langs.join(", ")}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-none text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function ActionCard({ to, search, icon, title, desc, cta, accent = false }: { to: string; search?: Record<string, string>; icon: React.ReactNode; title: string; desc: string; cta: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 ${accent ? "border-primary/40 bg-primary/[0.04]" : "border-border bg-card"}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <Link to={to} search={search as any} className={`mt-6 inline-block rounded-md px-4 py-2 text-sm font-medium ${accent ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:bg-accent"}`}>
        {cta}
      </Link>
    </div>
  );
}
