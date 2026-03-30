"use client";

import type { ReactNode } from "react";
import { Check, Pencil } from "lucide-react";

interface CollapsedSectionProps {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: ReactNode;
}

export function CollapsedSection({ title, editLabel, onEdit, children }: CollapsedSectionProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-primary uppercase tracking-wide flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5" />
          {title}
        </h2>
        <button type="button" onClick={onEdit} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <Pencil className="h-3 w-3" />
          {editLabel}
        </button>
      </div>
      {children}
    </div>
  );
}
