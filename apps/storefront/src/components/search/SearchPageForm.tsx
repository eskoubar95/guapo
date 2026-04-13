"use client";

import { trackSearchSubmitted } from "@/lib/analytics/posthog-ecommerce";

interface SearchPageFormProps {
  locale: string;
  defaultQuery?: string;
  placeholder: string;
  ariaLabel: string;
}

export function SearchPageForm({
  locale,
  defaultQuery,
  placeholder,
  ariaLabel,
}: SearchPageFormProps) {
  const base = `/${locale}`;

  return (
    <form
      action={`${base}/search`}
      method="GET"
      className="mb-8"
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        const q = String(fd.get("q") ?? "").trim();
        if (q) {
          trackSearchSubmitted({ query: q, source: "page_form" });
        }
      }}
    >
      <div className="relative">
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery ?? ""}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 pl-11 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          aria-label={ariaLabel}
        />
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </form>
  );
}
