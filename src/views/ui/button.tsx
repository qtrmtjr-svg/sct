import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-border bg-white text-ink hover:bg-surface",
  ghost: "bg-transparent text-ink hover:bg-white",
  danger: "bg-danger text-white hover:bg-danger/90",
};

export function buttonClass(variant: keyof typeof variants = "primary", className?: string) {
  return cn(
    "press inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  pending?: boolean;
};

export function Button({ className, variant = "primary", pending, disabled, children, ...props }: ButtonProps) {
  return (
    <button className={buttonClass(variant, className)} disabled={disabled || pending} {...props}>
      {children}
    </button>
  );
}
