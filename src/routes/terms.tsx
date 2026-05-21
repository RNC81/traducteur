import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/terms")({ component: TermsPage });

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <SiteNav />
      </div>

      <main className="flex-1 mx-auto max-w-4xl px-6 py-24">
        <div className="mb-12">
          <h1 className="font-display text-4xl mb-4">Conditions Générales d'Utilisation (CGU)</h1>
          <p className="text-muted-foreground text-lg">Dernière mise à jour : Mai 2026</p>
        </div>
        
        <div className="space-y-8 text-muted-foreground leading-relaxed">
          
          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) définissent les modalités d'accès et d'utilisation des services proposés par la plateforme Verba Live (ci-après "la Plateforme"), éditée par secrgnp. L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">2. Description du Service</h2>
            <p>
              Verba Live est un outil logiciel en tant que service (SaaS) permettant la transcription et la traduction en temps réel de flux vocaux lors d'événements, cours, ou rassemblements. Le service fournit une interface pour les orateurs (Créateurs) et un lien de visionnage en direct pour leur public (Spectateurs).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">3. Accès au service et Compte Utilisateur</h2>
            <p>
              L'accès à la création de sessions nécessite l'ouverture d'un compte gratuit. L'Utilisateur garantit que les informations fournies sont exactes et s'engage à maintenir la confidentialité de ses identifiants. secrgnp ne saurait être tenu responsable d'une utilisation frauduleuse du compte suite à une négligence de l'Utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">4. Obligations de l'Utilisateur</h2>
            <p>
              L'Utilisateur s'engage à n'utiliser la Plateforme qu'à des fins licites et conformes à la morale. Il est formellement interdit d'utiliser le service pour générer ou diffuser des traductions de discours incitant à la haine, à la violence, ou à toute activité illégale. secrgnp se réserve le droit de suspendre ou supprimer tout compte ne respectant pas ces obligations, sans préavis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">5. Responsabilité et Disponibilité</h2>
            <p>
              secrgnp s'efforce de maintenir la Plateforme accessible 24/7, mais n'est tenue qu'à une obligation de moyens. La responsabilité de secrgnp ne saurait être engagée en cas de panne, d'interruption du réseau, ou d'inexactitudes inhérentes aux technologies d'Intelligence Artificielle de traduction. La vérification de l'exactitude des traductions finales incombe aux utilisateurs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">6. Évolution des CGU</h2>
            <p>
              secrgnp se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs seront informés de toute modification substantielle. L'utilisation continue du service après modification vaut acceptation des nouvelles CGU.
            </p>
          </section>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
