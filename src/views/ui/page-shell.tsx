export function LoadingBlock() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8" aria-busy="true" aria-hidden>
      <div className="shimmer h-8 w-48 rounded-lg" />
      <div className="shimmer mt-3 h-4 w-72 max-w-full rounded" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="shimmer h-40 rounded-2xl" />
        <div className="shimmer h-40 rounded-2xl" />
        <div className="shimmer h-40 rounded-2xl" />
        <div className="shimmer h-40 rounded-2xl" />
      </div>
    </div>
  );
}

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      {subtitle ? <p className="mt-2 max-w-2xl text-muted">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}
