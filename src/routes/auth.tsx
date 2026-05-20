import { createFileRoute, useNavigate, Link } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { getSessionFn, signUpWithEmailFn } from "@/server/auth";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    getSessionFn().then((data) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const signInEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields.");
    
    setLoading(true);
    try {
      await signUpWithEmailFn({ data: { email, password } });
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error("Auth failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const signInGoogle = () => {
    toast.info("Google Auth is coming soon! Please use Email for now.");
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-stone-950 p-12 text-stone-100 md:flex">
        <Link to="/"><Logo /></Link>
        <div>
          <h2 className="font-display text-4xl leading-tight">"Speak once.<br/><span className="italic text-emerald-300">Heard everywhere.</span>"</h2>
          <p className="mt-4 max-w-sm text-sm text-stone-400">Live multilingual translation built for talks, events, and faith gatherings.</p>
        </div>
        <div className="text-xs text-stone-500">© {new Date().getFullYear()} Verba</div>
      </div>

      <div className="flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8"><Link to="/"><Logo /></Link></div>
          <h1 className="font-display text-3xl">Welcome to Verba</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to start translating live in 80+ languages.</p>

          <form onSubmit={signInEmail} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Continue with Email"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            <span className="text-xs text-muted-foreground">OR</span>
          </div>

          <button
            type="button"
            onClick={signInGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm transition hover:bg-accent disabled:opacity-60"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.708A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.708V4.96H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.04l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A9 9 0 0 0 .957 4.96L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}
