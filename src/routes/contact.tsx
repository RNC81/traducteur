import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({ component: ContactPage });

function ContactPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending email
    setTimeout(() => {
      setLoading(false);
      toast.success("Votre message a bien été envoyé. Nous vous répondrons très vite !");
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <SiteNav />
      </div>

      <main className="flex-1">
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6 grid gap-16 md:grid-cols-2">
            
            {/* Contact Info */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">Contact</div>
              <h1 className="font-display text-4xl md:text-5xl mb-6">Discutons de vos besoins.</h1>
              <p className="text-muted-foreground leading-relaxed mb-12">
                Que vous souhaitiez équiper votre mosquée, organiser une conférence internationale, ou que vous ayez des questions sur notre technologie, notre équipe est là pour vous accompagner.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Email</h3>
                    <p className="text-muted-foreground text-sm mt-1">Notre équipe vous répondra sous 24h.</p>
                    <a href="mailto:contact@verba-live.com" className="text-primary hover:underline text-sm font-medium mt-2 inline-block">contact@verba-live.com</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Siège Social</h3>
                    <p className="text-muted-foreground text-sm mt-1">Paris, France</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl">Envoyez-nous un message</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prénom</label>
                    <input required type="text" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Ali" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom</label>
                    <input required type="text" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Nathoo" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email professionnel / associatif</label>
                  <input required type="email" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="ali@exemple.com" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sujet</label>
                  <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <option>Demande d'information (Événementiel)</option>
                    <option>Organisation religieuse (Mosquée / Centre)</option>
                    <option>Support technique</option>
                    <option>Autre</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea required rows={4} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" placeholder="Décrivez votre projet ou votre besoin..."></textarea>
                </div>

                <button 
                  disabled={loading}
                  type="submit" 
                  className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Envoi en cours..." : "Envoyer le message"}
                </button>
              </form>
            </div>

          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
