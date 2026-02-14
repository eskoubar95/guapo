"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "checked"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const isControlled = checked !== undefined;
    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(false);
    const isChecked = isControlled ? checked : uncontrolledChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.checked;
      if (!isControlled) setUncontrolledChecked(next);
      onCheckedChange?.(next);
    };

    return (
      <input
        type="checkbox"
        ref={ref}
        checked={isControlled ? checked : uncontrolledChecked}
        onChange={handleChange}
        className={cn(
          "size-4 shrink-0 rounded border-2 border-border bg-background transition-colors",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "accent-primary",
          className
        )}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";
