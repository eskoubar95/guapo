/**
 * Payload CMS — Footer global for storefront.
 * Fetches from PAYLOAD_API_URL/api/storefront/globals/footer.
 */

const PAYLOAD_URL = process.env.PAYLOAD_API_URL?.replace(/\/$/, "");

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data as T;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
}

/** Populated page from Payload (for href resolution). */
export interface PayloadPageRef {
  id?: number;
  path?: string | null;
  slug?: string | null;
}

/** Single link in a footer column. */
export interface PayloadFooterLink {
  label: string;
  type?: "internal" | "external" | null;
  page?: PayloadPageRef | number | null;
  url?: string | null;
  newTab?: boolean | null;
}

/** One link column in the footer. */
export interface PayloadFooterColumn {
  title: string;
  links?: PayloadFooterLink[] | null;
}

/** Newsletter group from Payload. */
export interface PayloadFooterNewsletter {
  show?: boolean | null;
  title?: string | null;
  description?: string | null;
}

/** Social link from Payload. */
export interface PayloadFooterSocialLink {
  platform?: string | null;
  url?: string | null;
}

/** Footer global response. */
export interface PayloadFooter {
  id?: number;
  columns?: PayloadFooterColumn[] | null;
  newsletter?: PayloadFooterNewsletter | null;
  copyright?: string | null;
  socialLinks?: PayloadFooterSocialLink[] | null;
}

/** Resolved link for storefront. */
export interface ResolvedFooterLink {
  label: string;
  href: string;
  newTab?: boolean;
}

/** Resolved column for storefront. */
export interface ResolvedFooterColumn {
  title: string;
  links: ResolvedFooterLink[];
}

/** Resolved footer for storefront. */
export interface ResolvedFooter {
  columns: ResolvedFooterColumn[];
  newsletter: PayloadFooterNewsletter | null;
  copyright: string;
  socialLinks: PayloadFooterSocialLink[];
}

function getPathFromPage(page: PayloadPageRef | number | null | undefined): string {
  if (!page) return "";
  const p = typeof page === "object" ? page : null;
  if (!p?.path) return "";
  return p.path === "home" ? "" : p.path;
}

function resolveLinkHref(
  locale: string,
  type: "internal" | "external" | null | undefined,
  page: PayloadPageRef | number | null | undefined,
  url: string | null | undefined
): string {
  const base = `/${locale}`;
  if (type === "external" && url) return url;
  const path = getPathFromPage(page);
  return path ? `${base}/${path}` : base;
}

export function resolveFooter(
  locale: string,
  data: PayloadFooter | null
): ResolvedFooter {
  const base = `/${locale}`;
  const columns: ResolvedFooterColumn[] = (data?.columns ?? []).map((col) => ({
    title: col.title ?? "",
    links: (col.links ?? []).map((link) => ({
      label: link.label ?? "",
      href: resolveLinkHref(locale, link.type, link.page, link.url),
      newTab: link.newTab ?? false,
    })),
  }));

  const copyright =
    (data?.copyright ?? "© {year} Guapo. Alle rettigheder forbeholdes.").replace(
      "{year}",
      String(new Date().getFullYear())
    );

  return {
    columns,
    newsletter: data?.newsletter ?? null,
    copyright,
    socialLinks: data?.socialLinks ?? [],
  };
}

export async function fetchFooter(
  locale: string,
  options: { draft?: boolean } = {}
): Promise<PayloadFooter | null> {
  if (!PAYLOAD_URL) return null;

  const { draft = false } = options;
  const key = `payload:footer:${locale}:${draft}`;
  const cached = getCached<PayloadFooter | null>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      locale,
      "fallback-locale": "da",
    });
    if (draft) params.set("draft", "true");

    const res = await fetch(
      `${PAYLOAD_URL}/api/storefront/globals/footer?${params}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale === "da" ? "da,en" : "en,da",
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as PayloadFooter;
    setCache(key, data);
    return data;
  } catch {
    return null;
  }
}
