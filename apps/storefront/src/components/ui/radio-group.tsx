"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  name: string;
  value: string;
  onValueChange: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

function useRadioGroup() {
  const ctx = React.useContext(RadioGroupContext);
  if (!ctx) throw new Error("RadioGroupItem must be used within RadioGroup");
  return ctx;
}

interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({
  name: nameProp,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
  className,
}: RadioGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const name = nameProp ?? React.useId();

  const handleChange = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  const ctx = React.useMemo(
    () => ({ name, value, onValueChange: handleChange }),
    [name, value, handleChange]
  );

  return (
    <div
      data-slot="radio-group"
      role="radiogroup"
      className={cn("grid gap-3", className)}
    >
      <RadioGroupContext.Provider value={ctx}>
        {children}
      </RadioGroupContext.Provider>
    </div>
  );
}

interface RadioGroupItemProps {
  value: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroupItem({ value, id: idProp, children, className }: RadioGroupItemProps) {
  const { name, value: selectedValue, onValueChange } = useRadioGroup();
  const id = idProp ?? React.useId();
  const isChecked = selectedValue === value;

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-muted/50",
        className
      )}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={isChecked}
        onChange={() => onValueChange(value)}
        className="size-4 shrink-0 rounded-full border-2 border-input accent-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <span className="text-sm font-medium text-foreground">{children}</span>
    </label>
  );
}
