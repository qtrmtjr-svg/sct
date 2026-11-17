import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("lift rounded-2xl border border-border bg-white p-5 shadow-sm", className)}>{children}</div>;
}
