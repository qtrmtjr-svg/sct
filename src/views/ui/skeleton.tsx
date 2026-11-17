function Bone({ className }: { className: string }) {
  return <div className={`shimmer ${className}`} />;
}

export function QuickPaySkeleton() {
  return (
    <div className="rounded-2xl border border-[#ededed] bg-white p-4 shadow-[0_8px_24px_rgba(29,37,45,0.06)]" aria-hidden>
      <Bone className="h-6 w-32 rounded-md" />
      <Bone className="mt-4 h-8 w-full rounded-md" />
      <Bone className="mt-4 h-10 w-full rounded-lg" />
      <Bone className="mt-3 h-8 w-full rounded-md" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="bg-white" aria-busy="true" aria-hidden>
      <section className="mx-auto grid max-w-[1200px] gap-4 px-4 py-4 sm:py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Bone className="order-1 aspect-[5/4] rounded-[28px] lg:order-2 lg:aspect-auto lg:min-h-[540px]" />
        <div className="order-2 grid grid-cols-4 gap-2 lg:hidden">
          {["a", "b", "c", "d"].map((item) => (
            <Bone key={item} className="mx-auto h-16 w-16 rounded-full" />
          ))}
        </div>
        <div className="order-3 grid content-start gap-3 lg:order-1">
          <QuickPaySkeleton />
          <Bone className="hidden h-36 rounded-2xl lg:block" />
          <Bone className="hidden h-36 rounded-2xl lg:block" />
        </div>
      </section>
      <section className="mx-auto max-w-[1200px] px-4 py-8">
        <Bone className="h-8 w-56 rounded-lg" />
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {["a", "b", "c", "d"].map((item) => (
            <Bone key={item} className="h-64 rounded-3xl" />
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1200px] px-4 py-4">
        <Bone className="h-8 w-64 rounded-lg" />
        <div className="mt-4 flex gap-2">
          {["a", "b", "c", "d"].map((item) => (
            <Bone key={item} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {["a", "b", "c", "d"].map((item) => (
            <Bone key={item} className="h-52 rounded-2xl" />
          ))}
        </div>
      </section>
    </div>
  );
}
