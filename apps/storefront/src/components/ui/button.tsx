import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Button variants – pill shape (rounded-full) for CTAs to match
 * ProductPurchaseSection "Læg i kurv" / cart "Gå til kassen".
 * Focus: ring-2 ring-primary ring-offset-2.
 */
const variants = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full border border-transparent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full border border-transparent focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:outline-none",
  outline:
    "border border-border bg-background text-foreground hover:bg-surface hover:border-primary rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full border border-transparent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
  ghost:
    "hover:bg-surface hover:text-primary rounded-full border border-transparent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
  link: "text-primary underline-offset-4 hover:underline border-0 focus-visible:outline-none focus-visible:ring-0 rounded-none",
};

const sizes = {
  default: "h-10 px-5 py-2 text-sm",
  sm: "h-9 px-4 text-sm",
  lg: "h-12 px-8 py-4 text-sm",
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
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 shrink-0",
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
