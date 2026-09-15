export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-bold tracking-wide whitespace-nowrap " +
  "transition-[background-color,color,box-shadow,transform] duration-150 motion-reduce:transition-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-action text-fg-on-action hover:bg-action-hover",
  secondary: "border border-line-strong bg-surface text-fg hover:bg-surface-2",
  ghost: "text-fg hover:bg-surface-2",
  danger: "border border-danger text-danger hover:bg-surface-2",
};

// md/lg atingem o alvo de toque de 44 px; sm é reservado a áreas densas do Portal.
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-4 text-xs",
  md: "min-h-11 px-6 text-sm",
  lg: "min-h-14 px-8 text-base",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className = "") {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();
}
