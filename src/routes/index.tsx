import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Mic, Globe2, Sparkles, ShieldCheck, BookOpen, Languages, Zap, Users, Check } from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

const LANGS = ["English", "العربية", "Français", "Español", "Türkçe", "اردو", "فارسی", "Bahasa", "Deutsch", "Português", "हिन्दी", "Русский"];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-60"
             style={{ background: "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--primary) 18%, transparent), transparent 70%)" }} />
        <div className="mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Live translation, powered by AI
          </div>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
            Speak once.<br/>
            <span className="text-primary italic">Heard everywhere.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Verba turns your voice into instant, accurate translation for any audience —
            conferences, classrooms, livestreams, and faith gatherings.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
              Start translating free
            </Link>
            <a href="#demo" className="rounded-md border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-accent">
              See it in action
            </a>
          </div>

          {/* Demo card */}
          <div id="demo" className="mx-auto mt-16 max-w-3xl rounded-2xl border border-border bg-card p-1 shadow-2xl shadow-emerald-900/5">
            <div className="rounded-xl bg-gradient-to-br from-background to-muted p-6 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-medium">Live</span>
                  <span className="text-muted-foreground">· Speaker: EN</span>
                </div>
                <div className="text-xs text-muted-foreground">12 listeners</div>
              </div>
              <div className="mt-5 space-y-4">
                <Bubble lang="EN · original" text="Welcome everyone. Today we'll talk about how language can unite us across borders." />
                <Bubble lang="FR · français" text="Bienvenue à tous. Aujourd'hui, nous allons parler de la façon dont la langue peut nous unir au-delà des frontières." accent />
                <Bubble lang="AR · العربية" text="مرحباً بالجميع. اليوم سنتحدث عن كيف يمكن للغة أن توحدنا عبر الحدود." accent />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            {LANGS.map(l => (
              <span key={l} className="rounded-full border border-border bg-background/60 px-3 py-1">{l}</span>
            ))}
            <span className="rounded-full border border-border bg-background/60 px-3 py-1">+ 80 more</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Features</div>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Built for the moment you speak.</h2>
            <p className="mt-4 text-muted-foreground">Low-latency speech translation, transcripts in every language, and tools designed for real audiences.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <Feature icon={<Mic />} title="Real-time speech" text="Speak naturally. Translations stream to your audience with sub-second latency." />
            <Feature icon={<Globe2 />} title="80+ languages" text="From Arabic to Mandarin, with right-to-left and script support handled out of the box." />
            <Feature icon={<Sparkles />} title="AI that understands context" text="Specialized prompts keep meaning, tone, and terminology consistent across a full talk." />
            <Feature icon={<Users />} title="Audience rooms" text="Share a link — listeners pick their language and follow live, on any device." />
            <Feature icon={<BookOpen />} title="Transcripts & export" text="Every session is saved with searchable transcripts in every translated language." />
            <Feature icon={<ShieldCheck />} title="Private by default" text="Your audio stays yours. Sessions are encrypted and never used to train models." />
          </div>
        </div>
      </section>

      {/* FAITH MODE */}
      <section id="faith" className="bg-stone-950 text-stone-100">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              <Sparkles className="h-3 w-3" /> Faith Mode
            </div>
            <h2 className="mt-4 font-display text-4xl md:text-5xl text-white">For khutbahs, majalis, and religious gatherings.</h2>
            <p className="mt-5 text-stone-300">
              A dedicated mode tuned for Shia Islamic content — preserving Qur'anic verses, Arabic du'a, names of the Ahl al-Bayt (peace be upon them), and the cadence of religious speech.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-stone-200">
              <FaithItem text="Accurate handling of Qur'an quotations (kept in Arabic + translation)" />
              <FaithItem text="Trusted sources referenced for terminology and exegesis" />
              <FaithItem text="Respectful tone for sermons, lectures, and ziyarat" />
              <FaithItem text="Optimized for live majalis and recorded khutbahs alike" />
            </ul>
            <div className="mt-8">
              <div className="text-xs uppercase tracking-wider text-stone-400">Reference corpus</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {["Al-Islam.org", "Nahj al-Balagha", "Sahifa al-Sajjadiyya", "Tafsir al-Mizan"].map(s => (
                  <span key={s} className="rounded-full border border-stone-700 bg-stone-900 px-3 py-1 text-stone-200">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 shadow-2xl">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>Majlis · live</span>
              <span className="text-emerald-300">Faith Mode ON</span>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              <div className="rounded-xl bg-stone-950 p-4">
                <div className="text-[10px] uppercase tracking-wider text-stone-500">AR · original</div>
                <div className="mt-2 text-right font-display text-lg leading-relaxed" dir="rtl">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ — الحمد لله ربّ العالمين
                </div>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300">EN · translation</div>
                <div className="mt-2 leading-relaxed">
                  In the Name of Allah, the Most Gracious, the Most Merciful — all praise is due to Allah, Lord of the worlds.
                </div>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300">FR · traduction</div>
                <div className="mt-2 leading-relaxed">
                  Au Nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux — louange à Allah, Seigneur des mondes.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="border-y border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Use cases</div>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">One tool. Every audience.</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-4">
            <UseCase icon={<Zap />} title="Conferences" />
            <UseCase icon={<Users />} title="Classrooms" />
            <UseCase icon={<Languages />} title="Livestreams" />
            <UseCase icon={<BookOpen />} title="Religious gatherings" />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-background">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Pricing</div>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Simple, fair, scalable.</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <Plan name="Free" price="$0" desc="Try Verba live with short sessions." features={["30 min / month", "Up to 5 audience listeners", "12 languages", "Web access"]} />
            <Plan featured name="Pro" price="$19" desc="For creators, teachers, and speakers." features={["Unlimited sessions", "Up to 100 listeners", "80+ languages", "Faith Mode", "Export transcripts"]} />
            <Plan name="Organization" price="Custom" desc="For mosques, institutes, and enterprises." features={["Unlimited listeners", "Custom branding", "Priority models", "SSO & admin", "Dedicated support"]} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-stone-950 text-stone-100">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="font-display text-4xl md:text-5xl text-white">Your voice. Every language.</h2>
          <p className="mx-auto mt-4 max-w-xl text-stone-300">Start a live translated session in under a minute. No setup, no apps for your audience.</p>
          <div className="mt-8">
            <Link to="/auth" className="inline-flex rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Get started — it's free
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Bubble({ lang, text, accent = false }: { lang: string; text: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-primary/20 bg-primary/5" : "border-border bg-background"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{lang}</div>
      <div className="mt-1.5 text-sm leading-relaxed">{text}</div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-lg hover:shadow-emerald-900/5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function FaithItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="mt-0.5 h-4 w-4 flex-none text-emerald-400" />
      <span>{text}</span>
    </li>
  );
}

function UseCase({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="mt-4 font-medium">{title}</div>
    </div>
  );
}

function Plan({ name, price, desc, features, featured = false }: { name: string; price: string; desc: string; features: string[]; featured?: boolean }) {
  return (
    <div className={`relative rounded-2xl border p-8 ${featured ? "border-primary bg-primary/[0.04] shadow-lg shadow-emerald-900/10" : "border-border bg-card"}`}>
      {featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">Most popular</div>}
      <div className="font-display text-2xl">{name}</div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display text-4xl">{price}</span>
        {price.startsWith("$") && price !== "$0" && <span className="text-sm text-muted-foreground">/ month</span>}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-none text-primary" />{f}</li>
        ))}
      </ul>
      <Link to="/auth" className={`mt-8 block rounded-md px-4 py-2.5 text-center text-sm font-medium ${featured ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:bg-accent"}`}>
        Get started
      </Link>
    </div>
  );
}
