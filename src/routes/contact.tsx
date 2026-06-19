import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Mail, MapPin, MessageSquare, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({ component: ContactPage });

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string;

const SUBJECTS = [
  "Demande d'information (Événementiel)",
  "Organisation religieuse (Mosquée / Centre)",
  "Support technique",
  "Autre",
] as const;

type Subject = (typeof SUBJECTS)[number];

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [botcheck, setBotcheck] = useState("");

  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: SUBJECTS[0] as Subject,
    message: "",
  });

  const set =
    (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const firstName = fields.firstName.trim();
    const lastName = fields.lastName.trim();
    const message = fields.message.trim();

    if (firstName.length < 2) return toast.error("Le prénom doit contenir au moins 2 caractères.");
    if (firstName.length > 100) return toast.error("Prénom trop long (max 100 caractères).");
    if (lastName.length < 2) return toast.error("Le nom doit contenir au moins 2 caractères.");
    if (lastName.length > 100) return toast.error("Nom trop long (max 100 caractères).");
    if (!validateEmail(fields.email)) return toast.error("Adresse email invalide.");
    if (!(SUBJECTS as readonly string[]).includes(fields.subject)) return toast.error("Sujet invalide.");
    if (message.length < 10) return toast.error("Le message doit contenir au moins 10 caractères.");
    if (message.length > 2000) return toast.error("Le message ne peut pas dépasser 2000 caractères.");

    setLoading(true);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: `${firstName} ${lastName}`,
          email: fields.email,
          subject: `[Verba Contact] ${fields.subject}`,
          message,
          botcheck,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error();

      setSuccess(true);
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer ou nous écrire directement à contact@secrgnp.cloud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <SiteNav />
      </div>

      <main className="flex-1">
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6 grid gap-16 md:grid-cols-2">

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">Contact</div>
              <h1 className="font-display text-4xl md:text-5xl mb-6">Discutons de vos besoins.</h1>
              <p className="text-muted-foreground leading-relaxed mb-12">
                Que vous souhaitiez équiper votre mosquée, organiser une conférence internationale,
                ou que vous ayez des questions sur notre technologie, notre équipe est là pour vous accompagner.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Email</h3>
                    <p className="text-muted-foreground text-sm mt-1">Notre équipe vous répondra sous 24h.</p>
                    <a
                      href="mailto:contact@secrgnp.cloud"
                      className="text-primary hover:underline text-sm font-medium mt-2 inline-block"
                    >
                      contact@secrgnp.cloud
                    </a>
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

            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              {success ? (
                <SuccessState />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-center gap-3 mb-8">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <h2 className="font-display text-xl">Envoyez-nous un message</h2>
                  </div>

                  {/* Honeypot — invisible aux humains, détecté par Web3Forms côté serveur */}
                  <input
                    type="checkbox"
                    name="botcheck"
                    checked={botcheck === "true"}
                    onChange={(e) => setBotcheck(e.target.checked ? "true" : "")}
                    style={{ display: "none" }}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium">Prénom</label>
                      <input
                        id="firstName"
                        required
                        type="text"
                        value={fields.firstName}
                        onChange={set("firstName")}
                        maxLength={100}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Ali"
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">Nom</label>
                      <input
                        id="lastName"
                        required
                        type="text"
                        value={fields.lastName}
                        onChange={set("lastName")}
                        maxLength={100}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Nathoo"
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <input
                      id="email"
                      required
                      type="email"
                      value={fields.email}
                      onChange={set("email")}
                      maxLength={254}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="ali@exemple.com"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">Sujet</label>
                    <select
                      id="subject"
                      value={fields.subject}
                      onChange={set("subject")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({fields.message.length}/2000)
                      </span>
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={fields.message}
                      onChange={set("message")}
                      maxLength={2000}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      placeholder="Décrivez votre projet ou votre besoin..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Envoi en cours..." : "Envoyer le message"}
                  </button>
                </form>
              )}
            </div>

          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
        <CheckCircle className="h-8 w-8" />
      </div>
      <h2 className="font-display text-2xl mb-3">Message envoyé !</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        Merci pour votre message. Notre équipe vous répondra sous 24h à l'adresse indiquée.
      </p>
    </div>
  );
}
