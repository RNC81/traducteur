export function Logo({ className = "", mark = false }: { className?: string; mark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <span className="font-display text-lg leading-none">V</span>
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
      </span>
      {!mark && <span className="font-display text-xl tracking-tight">Verba</span>}
    </span>
  );
}
