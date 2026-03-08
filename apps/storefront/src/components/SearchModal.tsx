"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Clock, TrendingUp, Sparkles, FileText, ArrowRight, Eraser } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/components/ProductCard";
import type { Dictionary } from "@/i18n/dictionaries";

const RECENT_STORAGE_KEY = "guapo-search-recent";
const RECENT_MAX = 6;
const DEBOUNCE_MS = 280;

const POPULAR_TERMS = [
  "The Ordinary",
  "Retinol",
  "Niacinamide",
  "Cleanser",
  "Moisturizer",
  "Face Mask",
];

interface SearchArticle {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  dict: Dictionary;
}

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function pushRecentSearch(term: string): void {
  const trimmed = term.trim();
  if (!trimmed) return;
  const recent = getRecentSearches().filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...recent].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
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

  // Sync recent from storage when modal opens
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
        setProducts(data.products ?? []);
        setArticles(data.articles ?? []);
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

  const handleResultClick = (term: string) => {
    pushRecentSearch(term);
    setRecent(getRecentSearches());
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
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
          {/* Search input — no focus ring/border; only one X to close modal */}
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
                style={{ outline: "none", boxShadow: "none" }}
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
              <>
                {/* Recent searches */}
                {recent.length > 0 && (
                  <div className="px-5 py-4 border-b border-border">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {s.recentSearches}
                      </h3>
                      <button
                        type="button"
                        onClick={clearRecent}
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
                            onClick={() => handleSuggestionClick(term)}
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

                {/* Popular searches */}
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
                        onClick={() => handleSuggestionClick(term)}
                        className="px-3 py-2 rounded-lg bg-surface hover:bg-surface-muted text-sm text-foreground transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shortcuts */}
                <div className="px-5 py-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    {s.shortcuts}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`${base}/categories`}
                      onClick={onClose}
                      className="flex flex-col justify-center p-4 rounded-xl bg-linear-to-br from-primary/15 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-colors text-left"
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
            ) : (
              <div className="px-5 py-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                    <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">{s.searching}</span>
                  </div>
                ) : products.length === 0 && articles.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
                      <Search className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">{s.noResults}</p>
                    <p className="text-sm text-muted-foreground mt-1">{s.tryDifferent}</p>
                    <p className="text-xs text-muted-foreground mt-2">{s.minChars}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Products */}
                    {products.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{s.products}</h3>
                          <span className="text-xs text-muted-foreground">
                            {products.length === 1
                              ? s.resultCount
                              : s.resultsCount.replace("{{count}}", String(products.length))}
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {products.slice(0, 4).map((product) => (
                            <li key={product.id}>
                              <Link
                                href={`${base}/products/${product.id}`}
                                onClick={() => {
                                  handleResultClick(query.trim());
                                  onClose();
                                }}
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface transition-colors group"
                              >
                                <div className="w-14 h-14 rounded-lg bg-surface overflow-hidden shrink-0">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-muted" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  {product.brand ? (
                                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                                  ) : null}
                                  <p className="font-medium text-foreground text-sm truncate">
                                    {product.name}
                                  </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                  <span className="font-semibold text-foreground">
                                    {formatPrice(product.price, locale)}
                                  </span>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Articles */}
                    {articles.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">{s.articles}</h3>
                        <ul className="space-y-1">
                          {articles.map((article) => (
                            <li key={article.slug}>
                              <Link
                                href={`${base}/blog/${article.slug}`}
                                onClick={() => {
                                  handleResultClick(query.trim());
                                  onClose();
                                }}
                                className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface transition-colors group"
                              >
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  {article.publishedAt ? (
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(article.publishedAt).toLocaleDateString(
                                        locale === "da" ? "da-DK" : "en-GB",
                                        { day: "numeric", month: "short", year: "numeric" }
                                      )}
                                    </p>
                                  ) : null}
                                  <p className="font-medium text-foreground text-sm line-clamp-1">
                                    {article.title}
                                  </p>
                                  {article.excerpt ? (
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                      {article.excerpt}
                                    </p>
                                  ) : null}
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* View all */}
                    {(products.length > 0 || articles.length > 0) && (
                      <div className="pt-2 border-t border-border">
                        <Link
                          href={`${base}/search?q=${encodeURIComponent(query.trim())}`}
                          onClick={() => {
                            pushRecentSearch(query.trim());
                            onClose();
                          }}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          {locale === "da" ? "Se alle resultater" : "View all results"} →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer: keyboard hints */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface/30 text-xs text-muted-foreground">
            <span>↑↓ {s.selectHint}</span>
            <span>{s.closeHint}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
