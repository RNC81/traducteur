import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie, X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem("verba_cookies_acknowledged");
    if (!hasAccepted) {
      // Small delay so it doesn't pop instantly and aggressively
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem("verba_cookies_acknowledged", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="rounded-xl border border-border bg-card p-5 shadow-2xl flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary shrink-0">
            <Cookie className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm">Respect de votre vie privée</h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement du site (maintien de session). Aucun cookie publicitaire n'est utilisé. 
              En savoir plus dans notre <Link to="/privacy" className="text-primary hover:underline">Politique de Confidentialité</Link>.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button 
            onClick={handleAcknowledge}
            className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
