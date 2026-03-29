"use client";

import Link from "next/link";
import { Search, FileText, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/components/ProductCard";
import type { Dictionary } from "@/i18n/dictionaries";
import { pushRecentSearch } from "./search-storage";

export interface SearchArticle {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
}

interface SearchResultsListProps {
  locale: string;
  base: string;
  queryTrimmed: string;
  loading: boolean;
  products: Product[];
  articles: SearchArticle[];
  searchLabels: Dictionary["search"];
  onResultNavigate: (term: string) => void;
  onClose: () => void;
}

export function SearchResultsList({
  locale,
  base,
  queryTrimmed,
  loading,
  products,
  articles,
  searchLabels: s,
  onResultNavigate,
  onClose,
}: SearchResultsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
        <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">{s.searching}</span>
      </div>
    );
  }

  if (products.length === 0 && articles.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto mb-3">
          <Search className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">{s.noResults}</p>
        <p className="text-sm text-muted-foreground mt-1">{s.tryDifferent}</p>
        <p className="text-xs text-muted-foreground mt-2">{s.minChars}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                    onResultNavigate(queryTrimmed);
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

      {articles.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-2">{s.articles}</h3>
          <ul className="space-y-1">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`${base}/blog/${article.slug}`}
                  onClick={() => {
                    onResultNavigate(queryTrimmed);
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

      {(products.length > 0 || articles.length > 0) && (
        <div className="pt-2 border-t border-border">
          <Link
            href={`${base}/search?q=${encodeURIComponent(queryTrimmed)}`}
            onClick={() => {
              pushRecentSearch(queryTrimmed);
              onClose();
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            {s.viewAllResults} →
          </Link>
        </div>
      )}
    </div>
  );
}
