"use client";

import { Search, Clock } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";

interface SearchSuggestionsProps {
  recent: string[];
  searchLabels: Dictionary["search"];
  onSuggestionClick: (term: string) => void;
  onClearRecent: () => void;
}

export function SearchSuggestions({
  recent,
  searchLabels: s,
  onSuggestionClick,
  onClearRecent,
}: SearchSuggestionsProps) {
  if (recent.length === 0) return null;

  return (
    <div className="px-5 py-4">
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
  );
}
