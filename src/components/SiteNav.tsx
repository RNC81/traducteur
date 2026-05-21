import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center"><Logo /></Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="/#features" className="hover:text-foreground">Features</a>
          <a href="/#faith" className="hover:text-foreground">Faith Mode</a>
          <a href="/#pricing" className="hover:text-foreground">Pricing</a>
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">Sign in</Link>
          <Link
            to="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >Get started</Link>
        </div>
      </div>
    </header>
  );
}
