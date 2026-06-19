import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Mic, Globe2, Sparkles, ShieldCheck, BookOpen, Languages, Zap, Users, Check } from "lucide-react";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ReactLenis } from 'lenis/react';

export const Route = createFileRoute("/")({ component: Index });

const LANGS = ["English", "العربية", "Français", "Español", "Türkçe", "اردو", "فارسی", "Bahasa", "Deutsch", "Português", "हिन्दी", "Русский"];

function Phone3D() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div 
      className="relative w-[280px] h-[580px] perspective-[1200px]" 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="w-full h-full relative rounded-[3rem] border-8 border-stone-900 bg-background shadow-2xl shadow-emerald-500/20"
      >
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden bg-background">
          <div className="h-12 flex justify-between items-center px-6 border-b border-border text-[10px]">
             <span className="font-semibold tracking-wider text-muted-foreground">VERBA LIVE</span>
             <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/> 14 listeners</span>
          </div>
          <div className="p-4 space-y-4">
             <Bubble lang="EN · original" text="Welcome everyone. Today we'll talk about how language can unite us." />
             <Bubble lang="FR · français" text="Bienvenue à tous. Aujourd'hui, nous allons parler de la façon dont la langue peut nous unir." accent />
             <div className="animate-pulse text-muted-foreground/50 text-sm italic pt-2">Listening...</div>
          </div>
        </div>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-stone-900 rounded-full" style={{ transform: "translateZ(1px)" }} />
        <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none bg-gradient-to-tr from-white/0 via-white/10 to-white/0" style={{ transform: "translateZ(2px)" }} />
      </motion.div>
    </div>
  );
}

function Index() {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.5, smoothWheel: true }}>
      <div className="min-h-screen bg-background text-foreground">
      {/* HEADER FIXED */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <SiteNav />
      </div>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-60"
             style={{ background: "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--primary) 18%, transparent), transparent 70%)" }} />
        
        <div className="mx-auto max-w-6xl w-full px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live translation, powered by AI
            </div>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
              Speak once.<br/>
              <span className="text-primary italic">Heard everywhere.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Verba turns your voice into instant, accurate translation for any audience —
              conferences, classrooms, livestreams, and faith gatherings.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/auth" className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95">
                Start translating free
              </Link>
              <a href="#features" className="rounded-md border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors">
                Explore features
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {LANGS.slice(0, 5).map(l => (
                <span key={l} className="rounded-full border border-border bg-background/60 px-3 py-1">{l}</span>
              ))}
              <span className="rounded-full border border-border bg-background/60 px-3 py-1">+ 80 more</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex justify-center md:justify-end"
          >
            <Phone3D />
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      {/* FEATURES SECTION */}
      <section id="features" className="min-h-screen flex items-center justify-center border-t border-border/60 bg-background relative py-24">
        <div className="mx-auto max-w-6xl w-full px-6">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Features</div>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Built for the moment you speak.</h2>
            <p className="mt-4 text-muted-foreground">Low-latency speech translation, transcripts in every language, and tools designed for real audiences.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Feature icon={<Mic />} title="Real-time speech" text="Speak naturally. Translations stream to your audience with sub-second latency." />
            <Feature icon={<Globe2 />} title="80+ languages" text="From Arabic to Mandarin, with right-to-left and script support handled out of the box." />
            <Feature icon={<Sparkles />} title="AI that understands context" text="Specialized prompts keep meaning, tone, and terminology consistent across a full talk." />
            <Feature icon={<Users />} title="Audience rooms" text="Share a link — listeners pick their language and follow live, on any device." />
            <Feature icon={<BookOpen />} title="Transcripts & export" text="Every session is saved with searchable transcripts in every translated language." />
            <Feature icon={<ShieldCheck />} title="Private by default" text="Your audio stays yours. Sessions are encrypted and never used to train models." />
          </div>
        </div>
      </section>

      {/* FAITH MODE SECTION */}
      <section id="faith" className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-100 relative py-24">
        <div className="mx-auto grid max-w-6xl w-full gap-12 px-6 md:grid-cols-2 md:items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
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
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 shadow-2xl">
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
                <div className="text-[10px] uppercase tracking-wider text-emerald-300">FR · traduction</div>
                <div className="mt-2 leading-relaxed">
                  Au Nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux — louange à Allah, Seigneur des mondes.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="min-h-screen flex items-center justify-center border-y border-border/60 bg-background relative py-24">
        <div className="mx-auto max-w-6xl w-full px-6">
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
      {/* PRICING & CTA SECTION */}
      <section id="pricing" className="min-h-screen flex flex-col justify-between bg-background relative pt-24">
        <div className="mx-auto max-w-6xl w-full px-6 flex-1 flex flex-col justify-center">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">Tarifs</div>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Simple, transparent, évolutif.</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Plan
              name="Free"
              desc="Testez Verba en conditions réelles."
              features={["30 min / mois", "5 spectateurs max", "1 langue simultanée", "Accès web"]}
              ctaLabel="Commencer gratuitement"
              ctaHref="/auth"
            />
            <Plan
              featured
              name="Pro"
              price="69€"
              desc="Pour les créateurs, enseignants et orateurs."
              features={["Sessions illimitées", "3 langues simultanées", "100 spectateurs max", "Mode Religieux", "Export des transcriptions"]}
              ctaLabel="Commencer"
              ctaHref="/auth"
            />
            <Plan
              name="Enterprise"
              price="Sur devis"
              desc="Pour les mosquées, instituts et grandes organisations."
              features={["Langues illimitées", "Spectateurs illimités", "Glossaire sur-mesure", "Marque personnalisée", "Support dédié"]}
              ctaLabel="Nous contacter"
              ctaHref="/contact?subject=Enterprise"
            />
          </div>
        </div>

        <div className="w-full bg-stone-950 text-stone-100 mt-auto">
          <div className="mx-auto max-w-4xl px-6 py-12 text-center">
            <h2 className="font-display text-3xl md:text-4xl text-white">Votre voix. Toutes les langues.</h2>
            <div className="mt-6">
              <Link to="/auth" className="inline-flex rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-transform hover:scale-105">
                Commencer gratuitement
              </Link>
            </div>
          </div>
          <SiteFooter />
        </div>
      </section>
      </div>
    </ReactLenis>
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

function Plan({ name, price, desc, features, featured = false, ctaLabel, ctaHref }: {
  name: string; price?: string; desc: string; features: string[]; featured?: boolean; ctaLabel: string; ctaHref: string
}) {
  const displayPrice = price ?? "Gratuit";
  return (
    <div className={`relative rounded-2xl border p-8 ${featured ? "border-primary bg-primary/[0.04] shadow-lg shadow-emerald-900/10" : "border-border bg-card"}`}>
      {featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">Le plus populaire</div>}
      <div className="font-display text-2xl">{name}</div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display text-4xl">{displayPrice}</span>
        {price?.endsWith("€") && <span className="text-sm text-muted-foreground">/ mois</span>}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map(f => (
          <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-none text-primary" />{f}</li>
        ))}
      </ul>
      <a href={ctaHref} className={`mt-8 block rounded-md px-4 py-2.5 text-center text-sm font-medium transition-colors ${featured ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:bg-accent"}`}>
        {ctaLabel}
      </a>
    </div>
  );
}
