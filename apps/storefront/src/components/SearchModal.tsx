"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Eraser } from "lucide-react";
import type { Product } from "@/components/ProductCard";
import type { Dictionary } from "@/i18n/dictionaries";
import { getRecentSearches, pushRecentSearch, clearRecentSearches } from "@/components/search/search-storage";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";
import { SearchResultsList, type SearchArticle } from "@/components/search/SearchResultsList";
import {
  trackSearchResultsViewed,
  trackSearchSubmitted,
} from "@/lib/analytics/posthog-ecommerce";

const DEBOUNCE_MS = 280;

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  dict: Dictionary;
}

export function SearchModal({ isOpen, onClose, locale, dict }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [articles, setArticles] = useState<SearchArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const base = `/${locale}`;
  const s = dict.search;
  const showSuggestions = query.trim().length < 2;
  const hasQuery = query.trim().length >= 2;

  useEffect(() => {
    if (isOpen) setRecent(getRecentSearches());
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (trimmed.length < 2) {
        setProducts([]);
        setArticles([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?${new URLSearchParams({ q: trimmed, locale })}`
        );
        const data = (await res.json()) as {
          products?: Product[];
          articles?: SearchArticle[];
        };
        const prod = data.products ?? [];
        const arts = data.articles ?? [];
        setProducts(prod);
        setArticles(arts);
        trackSearchResultsViewed({
          query: trimmed,
          product_count: prod.length,
          article_count: arts.length,
          source: "modal",
        });
      } catch {
        setProducts([]);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    },
    [locale]
  );

  useEffect(() => {
    if (!hasQuery) {
      setProducts([]);
      setArticles([]);
      return;
    }
    const t = setTimeout(() => runSearch(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, hasQuery, runSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      trackSearchSubmitted({ query: q, source: "modal" });
      pushRecentSearch(q);
      setRecent(getRecentSearches());
      router.push(`${base}/search?q=${encodeURIComponent(q)}`);
      setQuery("");
      onClose();
    }
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  const handleResultNavigate = (term: string) => {
    pushRecentSearch(term);
    setRecent(getRecentSearches());
  };

  const clearRecent = () => {
    clearRecentSearches();
    setRecent([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative flex items-start justify-center pt-16 md:pt-24 px-4"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl overflow-hidden border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="border-b border-border search-modal-form">
            <div className="flex items-center gap-3 px-5 py-4">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder={s.placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-modal-input flex-1 min-w-0 text-foreground placeholder:text-muted-foreground bg-transparent border-0 text-base outline-none shadow-none focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 [&:focus]:outline-none [&:focus]:ring-0 [&:focus]:shadow-none"
                aria-label={dict.common.search}
                autoComplete="off"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-2 hover:bg-surface rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  aria-label={s.clearRecent}
                  title={s.clearRecent}
                >
                  <Eraser className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-surface rounded-lg transition-colors text-muted-foreground"
                aria-label={s.closeHint}
                title={s.closeHint}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="max-h-[60vh] md:max-h-[500px] overflow-y-auto">
            {showSuggestions ? (
              <SearchSuggestions
                base={base}
                recent={recent}
                searchLabels={s}
                onSuggestionClick={handleSuggestionClick}
                onClearRecent={clearRecent}
                onClose={onClose}
              />
            ) : (
              <div className="px-5 py-4">
                <SearchResultsList
                  locale={locale}
                  base={base}
                  queryTrimmed={query.trim()}
                  loading={loading}
                  products={products}
                  articles={articles}
                  searchLabels={s}
                  onResultNavigate={handleResultNavigate}
                  onClose={onClose}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface/30 text-xs text-muted-foreground">
            <span>↑↓ {s.selectHint}</span>
            <span>{s.closeHint}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
