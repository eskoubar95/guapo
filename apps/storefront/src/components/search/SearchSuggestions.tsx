"use client";

import Link from "next/link";
import { Search, Clock, TrendingUp, Sparkles } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";

const POPULAR_TERMS = [
  "The Ordinary",
  "Retinol",
  "Niacinamide",
  "Cleanser",
  "Moisturizer",
  "Face Mask",
];

interface SearchSuggestionsProps {
  base: string;
  recent: string[];
  searchLabels: Dictionary["search"];
  onSuggestionClick: (term: string) => void;
  onClearRecent: () => void;
  onClose: () => void;
}

export function SearchSuggestions({
  base,
  recent,
  searchLabels: s,
  onSuggestionClick,
  onClearRecent,
  onClose,
}: SearchSuggestionsProps) {
  return (
    <>
      {recent.length > 0 && (
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {s.recentSearches}
            </h3>
            <button
              type="button"
              onClick={onClearRecent}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {s.clearRecent}
            </button>
          </div>
          <ul className="space-y-1">
            {recent.map((term) => (
              <li key={term}>
                <button
                  type="button"
                  onClick={() => onSuggestionClick(term)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface text-left text-sm text-foreground"
                >
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{term}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          {s.popularSearches}
        </h3>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TERMS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSuggestionClick(term)}
              className="px-3 py-2 rounded-lg bg-surface hover:bg-surface-muted text-sm text-foreground transition-colors"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          {s.shortcuts}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`${base}/categories`}
            onClick={onClose}
            className="flex flex-col justify-center p-4 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-colors text-left"
          >
            <span className="font-semibold text-foreground">{s.bestsellers}</span>
            <span className="text-sm text-muted-foreground mt-0.5">{s.bestsellersSub}</span>
          </Link>
          <Link
            href={base}
            onClick={onClose}
            className="flex flex-col justify-center p-4 rounded-xl bg-surface hover:bg-surface-muted transition-colors text-left"
          >
            <span className="font-semibold text-foreground">{s.newArrivals}</span>
            <span className="text-sm text-muted-foreground mt-0.5">{s.newArrivalsSub}</span>
          </Link>
        </div>
      </div>
    </>
  );
}
