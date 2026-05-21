import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ShieldAlert, Server, Lock } from "lucide-react";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <SiteNav />
      </div>

      <main className="flex-1 mx-auto max-w-4xl px-6 py-24">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mb-6">
            <Lock className="h-3 w-3" /> Conforme RGPD
          </div>
          <h1 className="font-display text-4xl mb-4">Politique de Confidentialité</h1>
          <p className="text-muted-foreground text-lg">Dernière mise à jour : Mai 2026</p>
        </div>
        
        <div className="space-y-12 text-muted-foreground leading-relaxed">
          
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8">
            <h2 className="text-2xl font-medium text-emerald-400 mb-4 flex items-center gap-3">
              <ShieldAlert className="h-6 w-6" /> 
              Traitement des Données Vocales (Point Critique)
            </h2>
            <p className="mb-4 text-emerald-100/80">
              Verba Live traite vos données vocales en temps réel pour générer des traductions. <strong>Notre engagement est strict :</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-emerald-100/70">
              <li><strong>Aucun stockage audio :</strong> Votre voix (donnée biométrique) n'est <strong>jamais</strong> enregistrée sur nos serveurs. L'audio est traité en direct par le navigateur puis détruit immédiatement.</li>
              <li><strong>Aucun entraînement d'IA :</strong> Les textes traduits et transcrits qui transitent par nos API partenaires (Google Cloud, Mistral AI, OpenAI) sont sous des contrats stricts de "Zero Data Retention". Vos mots ne servent en aucun cas à entraîner des modèles d'intelligence artificielle publics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">1. Données collectées</h2>
            <p>
              Nous collectons uniquement les données strictement nécessaires au fonctionnement du service :
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Pour les Créateurs (Orateurs) :</strong> Adresse email et mot de passe (chiffré via bcrypt) lors de la création d'un compte. Historique des sessions et textes transcrits (supprimables à tout moment).</li>
              <li><strong>Pour le Public (Spectateurs) :</strong> Aucune donnée personnelle n'est requise. Les spectateurs rejoignent une session de manière totalement anonyme via un lien partagé.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">2. Cookies et Traceurs</h2>
            <p>
              Nous utilisons des cookies <strong>exclusivement fonctionnels</strong>. Le seul cookie utilisé par notre plateforme (<code>auth_token</code>) sert à maintenir la connexion sécurisée des créateurs de contenu. 
              Nous n'utilisons <strong>aucun cookie publicitaire</strong> ni aucun traceur intrusif de tierce partie.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4 flex items-center gap-2">
              <Server className="h-5 w-5" /> 3. Hébergement et Sécurité
            </h2>
            <p>
              Les données de compte et les transcriptions textuelles sont stockées sur des bases de données MongoDB Atlas sécurisées. Les mots de passe sont hachés de manière irréversible. Les échanges entre votre navigateur et nos serveurs sont chiffrés de bout en bout via le protocole TLS/SSL (HTTPS).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">4. Vos droits (RGPD)</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. 
            </p>
            <p className="mt-4">
              Vous pouvez exercer la suppression totale de vos données directement depuis votre tableau de bord (Dashboard), en supprimant vos sessions, ou en nous contactant à <a href="mailto:privacy@verba-live.com" className="text-primary hover:underline">privacy@verba-live.com</a>.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
