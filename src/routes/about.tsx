import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Users, Globe, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <SiteNav />
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/50 pt-24 pb-32">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-30"
               style={{ background: "radial-gradient(40% 50% at 50% 0%, color-mix(in oklch, var(--primary) 15%, transparent), transparent 70%)" }} />
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="font-display text-5xl tracking-tight md:text-6xl">
              Détruire les barrières de la langue. <br/>
              <span className="text-primary italic">Connecter les cœurs.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground">
              Verba est née d'un constat simple : la langue ne devrait jamais être un obstacle au partage du savoir, de la spiritualité et des idées.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-24">
          <div className="mx-auto max-w-5xl px-6 grid gap-16 md:grid-cols-2 items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">Notre Mission</div>
              <h2 className="font-display text-3xl md:text-4xl mb-6">Permettre à chacun de comprendre, en temps réel.</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Que ce soit lors de rassemblements spirituels (Khutbas, Majalis), de conférences internationales ou de cours universitaires, la traduction simultanée était jusqu'à présent un luxe réservé aux grands événements disposant de cabines et d'interprètes humains coûteux.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Avec Verba, nous mettons l'intelligence artificielle la plus avancée au service de la communauté. Notre technologie écoute, comprend, vérifie le contexte (même théologique), et diffuse une traduction ultra-rapide sur le téléphone de chaque auditeur, dans sa propre langue.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <Globe className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-display text-xl mb-2">Accessibilité Universelle</h3>
                <p className="text-sm text-muted-foreground">Support de plus de 80 langues dont l'Arabe, l'Ourdou, le Farsi et le Français pour rassembler des communautés diversifiées.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <ShieldCheck className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-display text-xl mb-2">Respect et Précision</h3>
                <p className="text-sm text-muted-foreground">Un mode dédié aux discours religieux garantissant le respect de la terminologie et la préservation des textes sacrés.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Vision Scalable */}
        <section className="py-24 bg-stone-950 text-stone-100">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <Users className="h-12 w-12 text-emerald-400 mx-auto mb-6" />
            <h2 className="font-display text-3xl md:text-4xl mb-6">L'avenir de l'audience en direct</h2>
            <p className="text-stone-300 leading-relaxed mb-8 max-w-2xl mx-auto">
              Nous construisons une plateforme scalable, capable d'accueillir de 10 à 10 000 auditeurs simultanés sans latence. Notre objectif n'est pas de remplacer l'interaction humaine, mais de l'amplifier en s'assurant que personne ne soit laissé de côté à cause d'une barrière linguistique.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
