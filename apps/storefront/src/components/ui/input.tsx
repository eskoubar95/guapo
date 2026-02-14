import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border-2 border-border bg-input-background px-3 py-1 text-base text-foreground placeholder:text-muted-foreground transition-colors outline-none",
        "focus-visible:border-primary focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
        "aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
