/**
 * Payload CMS — Navigation global for storefront.
 * Fetches from PAYLOAD_API_URL/api/storefront/globals/navigation.
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

/** Populated page from Payload (minimal for href resolution). */
export interface PayloadPage {
  id?: number;
  path?: string | null;
  slug?: string | null;
}

/** Link group from Payload mainMenu (type: link). */
export interface PayloadNavLink {
  type?: "internal" | "external" | null;
  page?: PayloadPage | number | null;
  url?: string | null;
  newTab?: boolean | null;
}

/** Child item in a dropdown. */
export interface PayloadNavChild {
  label: string;
  type?: "internal" | "external" | null;
  page?: PayloadPage | number | null;
  url?: string | null;
  newTab?: boolean | null;
}

/** Icon key from Payload (optional per menu item). */
export type PayloadNavIconKey =
  | "none"
  | "grid"
  | "tag"
  | "sparkles"
  | "shopping-bag"
  | "file-text"
  | "home";

/** Main menu item from Payload. */
export interface PayloadNavMenuItem {
  label: string;
  type: "link" | "dropdown";
  icon?: PayloadNavIconKey | string | null;
  link?: PayloadNavLink | null;
  children?: PayloadNavChild[] | null;
}

/** Promotion bar (top banner) from Payload. */
export interface PayloadNavPromotionBar {
  show?: boolean | null;
  text?: string | null;
  url?: string | null;
}

/** CTA button from Payload. */
export interface PayloadNavCtaButton {
  show?: boolean | null;
  label?: string | null;
  url?: string | null;
}

/** One section in menuSections (card = white box, flat = on sidebar background). */
export interface PayloadNavMenuSection {
  title?: string | null;
  sectionStyle?: "card" | "flat" | null;
  items?: PayloadNavMenuItem[] | null;
}

/** Navigation global response. */
export interface PayloadNavigation {
  id?: number;
  menuSections?: PayloadNavMenuSection[] | null;
  mainMenu?: PayloadNavMenuItem[] | null;
  promotionBar?: PayloadNavPromotionBar | null;
  ctaButton?: PayloadNavCtaButton | null;
}

/** Normalized item for SidebarMenu: single link. */
export interface NavLinkItem {
  type: "link";
  label: string;
  href: string;
  newTab?: boolean;
  icon?: PayloadNavIconKey | string | null;
}

/** Normalized item for SidebarMenu: dropdown with children. */
export interface NavDropdownItem {
  type: "dropdown";
  label: string;
  children: Array< { label: string; href: string; newTab?: boolean } >;
  icon?: PayloadNavIconKey | string | null;
}

export type NavMenuItem = NavLinkItem | NavDropdownItem;

/** One block in the sidebar: optional title, style (card/flat), items. */
export interface NavSection {
  title?: string | null;
  sectionStyle?: "card" | "flat";
  items: NavMenuItem[];
}

function getPathFromPage(page: PayloadPage | number | null | undefined): string {
  if (!page) return "";
  const p = typeof page === "object" ? page : null;
  if (!p?.path) return "";
  return p.path === "home" ? "" : p.path;
}

function resolveHref(
  locale: string,
  type: "internal" | "external" | null | undefined,
  page: PayloadPage | number | null | undefined,
  url: string | null | undefined
): string {
  const base = `/${locale}`;
  if (type === "external" && url) return url;
  const path = getPathFromPage(page);
  return path ? `${base}/${path}` : base;
}

/**
 * Normalize Payload mainMenu to storefront menu items (resolved hrefs).
 */
export function normalizeMainMenu(
  locale: string,
  mainMenu: PayloadNavMenuItem[] | null | undefined
): NavMenuItem[] {
  if (!mainMenu?.length) return [];

  return mainMenu.map((item) => {
    const icon = item.icon && item.icon !== "none" ? item.icon : undefined;
    if (item.type === "dropdown" && item.children?.length) {
      return {
        type: "dropdown" as const,
        label: item.label,
        icon,
        children: item.children.map((child) => ({
          label: child.label,
          href: resolveHref(
            locale,
            child.type,
            child.page,
            child.url
          ),
          newTab: child.newTab ?? false,
        })),
      };
    }
    const link = item.link;
    const href =
      item.type === "link" && link
        ? resolveHref(locale, link.type, link.page, link.url)
        : "#";
    return {
      type: "link" as const,
      label: item.label,
      href,
      newTab: link?.newTab ?? false,
      icon,
    };
  });
}

/**
 * Normalize navigation to sections (one per white box). Uses menuSections if present, else one section from mainMenu.
 */
export function normalizeMenuSections(
  locale: string,
  nav: PayloadNavigation | null | undefined
): NavSection[] {
  if (!nav) return [];

  const sections = nav.menuSections?.filter((s) => s?.items?.length);
  if (sections?.length) {
    return sections.map((s) => ({
      title: s.title ?? undefined,
      sectionStyle: s.sectionStyle === "flat" ? "flat" : "card",
      items: normalizeMainMenu(locale, s.items),
    }));
  }

  const mainItems = normalizeMainMenu(locale, nav.mainMenu);
  if (!mainItems.length) return [];
  return [{ sectionStyle: "card" as const, items: mainItems }];
}

/**
 * Fetch Navigation global from Payload. Returns null if CMS not configured or request fails.
 */
export async function fetchNavigation(
  locale: string,
  options: { draft?: boolean } = {}
): Promise<PayloadNavigation | null> {
  if (!PAYLOAD_URL) return null;

  const { draft = false } = options;
  const key = `payload:navigation:${locale}:${draft}`;
  const cached = getCached<PayloadNavigation | null>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      locale,
      "fallback-locale": "da",
    });
    if (draft) params.set("draft", "true");

    const res = await fetch(
      `${PAYLOAD_URL}/api/storefront/globals/navigation?${params}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale === "da" ? "da,en" : "en,da",
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as PayloadNavigation;
    setCache(key, data);
    return data;
  } catch {
    return null;
  }
}
