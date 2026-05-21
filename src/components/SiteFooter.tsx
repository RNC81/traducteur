import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Speak once. Heard everywhere. Live multilingual translation for talks, events, video, and faith gatherings.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="/#features" className="hover:text-primary">Features</a></li>
            <li><a href="/#faith" className="hover:text-primary">Faith Mode</a></li>
            <li><a href="/#pricing" className="hover:text-primary">Pricing</a></li>
            <li><Link to="/auth" className="hover:text-primary">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link to="/legal" className="hover:text-primary">Legal / Mentions Légales</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-primary">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Verba. All rights reserved.
      </div>
    </footer>
  );
}
