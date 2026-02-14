"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openValue: string | null;
  onOpenChange: (value: string | null) => void;
  type: "single";
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion components must be used within Accordion");
  return ctx;
}

interface AccordionProps {
  type?: "single";
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  children: React.ReactNode;
  className?: string;
}

export function Accordion({
  type = "single",
  value: controlledValue,
  defaultValue = null,
  onValueChange,
  children,
  className,
}: AccordionProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | null>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const openValue = isControlled ? controlledValue : uncontrolledValue;

  const onOpenChange = React.useCallback(
    (next: string | null) => {
      if (!isControlled) setUncontrolledValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  const ctx: AccordionContextValue = React.useMemo(
    () => ({ openValue, onOpenChange, type }),
    [openValue, onOpenChange, type]
  );

  return (
    <AccordionContext.Provider value={ctx}>
      <div data-slot="accordion" className={cn(className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <div
      data-slot="accordion-item"
      data-value={value}
      className={cn("border-b border-border last:border-b-0", className)}
    >
      {children}
    </div>
  );
}

interface AccordionTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionTrigger({ value, children, className }: AccordionTriggerProps) {
  const { openValue, onOpenChange } = useAccordion();
  const isOpen = openValue === value;

  return (
    <button
      type="button"
      data-state={isOpen ? "open" : "closed"}
      aria-expanded={isOpen}
      aria-controls={`accordion-content-${value}`}
      id={`accordion-trigger-${value}`}
      onClick={() => onOpenChange(isOpen ? null : value)}
      className={cn(
        "flex w-full flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&>svg]:shrink-0",
        isOpen && "[&>svg]:rotate-180",
        className
      )}
    >
      {children}
      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </button>
  );
}

interface AccordionContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionContent({ value, children, className }: AccordionContentProps) {
  const { openValue } = useAccordion();
  const isOpen = openValue === value;

  return (
    <div
      id={`accordion-content-${value}`}
      role="region"
      aria-labelledby={`accordion-trigger-${value}`}
      data-state={isOpen ? "open" : "closed"}
      className={cn("overflow-hidden text-sm", !isOpen && "hidden")}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
  );
}
