import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/legal")({ component: LegalPage });

function LegalPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <SiteNav />
      </div>

      <main className="flex-1 mx-auto max-w-4xl px-6 py-24">
        <h1 className="font-display text-4xl mb-8">Mentions Légales</h1>
        
        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">1. Éditeur du site</h2>
            <p>
              Le site internet <strong>Verba Live</strong> est édité par l'entité <strong>secrgnp</strong>.
            </p>
            <p className="mt-2">
              Email de contact : <a href="mailto:contact@secrgnp.cloud" className="text-primary hover:underline">contact@secrgnp.cloud</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">2. Hébergement</h2>
            <p>
              L'hébergement de la plateforme (frontend et API) est assuré par <strong>Render Networks, Inc.</strong><br/>
              Adresse : 525 3rd Street, Suite 200, San Francisco, CA 94107, USA.<br/>
              Site web : <a href="https://render.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">render.com</a>
            </p>
            <p className="mt-2">
              Le service de base de données est hébergé par <strong>MongoDB Atlas</strong>, sur des serveurs sécurisés situés en Europe (Francfort ou Paris, selon l'allocation).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">3. Propriété intellectuelle</h2>
            <p>
              L'ensemble de ce site relève des législations françaises et internationales sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents iconographiques et photographiques.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-foreground mb-4">4. Données personnelles</h2>
            <p>
              D'une façon générale, vous pouvez visiter notre site sur Internet sans avoir à décliner votre identité et à fournir des informations personnelles vous concernant. Cependant, nous pouvons parfois vous demander des informations, par exemple, pour traiter une commande, établir une correspondance, fournir un abonnement ou soumettre une candidature à un poste.
            </p>
            <p className="mt-2">
              Pour plus d'informations sur le traitement des données, veuillez consulter notre <a href="/privacy" className="text-primary hover:underline">Politique de Confidentialité</a>.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
