import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Button variants – rounded-lg (--radius-lg) to align with inputs and design tokens.
 * Focus: ring-2 ring-primary/20 for a soft, professional focus state.
 */
const variants = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg border border-transparent focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:outline-none",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg border border-transparent focus-visible:ring-2 focus-visible:ring-destructive/20 focus-visible:ring-offset-2 focus-visible:outline-none",
  outline:
    "border border-border bg-background text-foreground hover:bg-surface hover:border-primary/50 rounded-lg focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:outline-none",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg border border-transparent focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:outline-none",
  ghost:
    "hover:bg-surface hover:text-primary rounded-lg border border-transparent focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:outline-none",
  link: "text-primary underline-offset-4 hover:underline border-0 focus-visible:outline-none focus-visible:ring-0 rounded-none",
};

const sizes = {
  default: "h-10 px-5 py-2 text-sm",
  sm: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-sm",
  icon: "size-10 p-0 rounded-full",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 shrink-0",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };
