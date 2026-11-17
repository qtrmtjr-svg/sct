import { cn } from "@/lib/cn";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className, ...props }: Props) {
  const inputId = id ?? props.name;
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink" htmlFor={inputId}>
      {label}
      <input
        id={inputId}
        className={cn(
          "h-11 rounded-xl border border-border bg-white px-3 text-base font-normal outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary",
          error && "border-danger",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-danger">{error}</span> : null}
    </label>
  );
}
