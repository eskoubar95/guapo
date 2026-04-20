import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isValidLocale, type Locale } from "./i18n/config";
import { coercePublishedLocales, parsePublishedLocalesFromEnv } from "./i18n/published-locales";

const PUBLISHED_LOCALES_FETCH_MS = 1500;

async function getPublishedLocalesForRequest(request: NextRequest): Promise<readonly Locale[]> {
  const fromEnv = parsePublishedLocalesFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  const url = new URL("/api/internal/published-locales", request.nextUrl.origin);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PUBLISHED_LOCALES_FETCH_MS);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return [defaultLocale];
    }
    const data = (await res.json()) as { locales?: string[] };
    const raw = Array.isArray(data.locales) ? data.locales : [];
    return coercePublishedLocales(raw);
  } catch {
    return [defaultLocale];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Middleware for locale detection and routing
 *
 * - Redirects root (/) to default or cookie-persisted locale (clamped to published locales)
 * - Redirects unsupported-but-known locales (e.g. /en when only da is published) to /da
 * - Validates locale in URL path
 * - Sets locale cookie for persistence
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, api routes, and _next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes("/favicon.ico") ||
    pathname.includes(".") // Static files
  ) {
    return NextResponse.next();
  }

  const pathnameLocale = pathname.split("/")[1];
  const hasValidLocale = isValidLocale(pathnameLocale);
  const publishedLocales = await getPublishedLocalesForRequest(request);
  const publishedSet = new Set(publishedLocales);

  // If no locale in path, redirect to preferred published locale
  if (!hasValidLocale) {
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    const preferredFromCookie =
      cookieLocale && isValidLocale(cookieLocale) && publishedSet.has(cookieLocale as Locale)
        ? (cookieLocale as Locale)
        : defaultLocale;

    const newUrl = new URL(`/${preferredFromCookie}${pathname}`, request.url);
    newUrl.search = request.nextUrl.search;
    return NextResponse.redirect(newUrl);
  }

  // Known locale code in URL but not published → redirect to default locale, same path suffix
  if (hasValidLocale && !publishedSet.has(pathnameLocale as Locale)) {
    const rest = pathname.slice(`/${pathnameLocale}`.length) || "";
    const target = new URL(`/${defaultLocale}${rest}`, request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (pathnameLocale !== request.cookies.get("NEXT_LOCALE")?.value) {
    response.cookies.set("NEXT_LOCALE", pathnameLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export const config = {
  // Match all paths except static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
