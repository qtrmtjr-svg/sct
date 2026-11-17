import { cn } from "@/lib/cn";
import { statusClass } from "@/lib/status-class";

export function Badge({ status, label }: { status: string; label: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", statusClass(status))}>
      {label}
    </span>
  );
}
