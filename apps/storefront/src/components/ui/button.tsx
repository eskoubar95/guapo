import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default:
    "bg-primary text-primary-foreground hover:opacity-90 rounded-lg border-2 border-transparent focus-visible:border-primary focus-visible:outline-none",
  destructive:
    "bg-destructive text-destructive-foreground hover:opacity-90 rounded-lg border-2 border-transparent focus-visible:border-destructive focus-visible:outline-none",
  outline:
    "border-2 border-border bg-background text-foreground hover:bg-surface hover:border-primary rounded-lg focus-visible:border-primary focus-visible:outline-none",
  secondary:
    "bg-secondary text-secondary-foreground hover:opacity-90 rounded-lg border-2 border-transparent focus-visible:border-primary focus-visible:outline-none",
  ghost:
    "hover:bg-surface hover:text-primary rounded-lg border-2 border-transparent focus-visible:border-primary focus-visible:outline-none",
  link: "text-primary underline-offset-4 hover:underline border-0 focus-visible:outline-none",
};

const sizes = {
  default: "h-10 px-5 py-2 text-sm",
  sm: "h-9 px-4 text-sm",
  lg: "h-12 px-8 text-base",
  icon: "size-10 p-0",
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
