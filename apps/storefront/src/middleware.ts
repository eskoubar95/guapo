import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, isValidLocale } from "./i18n/config";

/**
 * Middleware for locale detection and routing
 * 
 * - Redirects root (/) to default locale (/da)
 * - Validates locale in URL path
 * - Sets locale cookie for persistence
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the pathname starts with a valid locale
  const pathnameLocale = pathname.split("/")[1];
  const hasValidLocale = isValidLocale(pathnameLocale);

  // Skip middleware for static files, api routes, and _next
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes("/favicon.ico") ||
    pathname.includes(".") // Static files
  ) {
    return NextResponse.next();
  }

  // If no locale in path, redirect to default locale
  if (!hasValidLocale) {
    // Check for locale preference in cookie
    const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
    const preferredLocale = cookieLocale && isValidLocale(cookieLocale) 
      ? cookieLocale 
      : defaultLocale;

    const newUrl = new URL(`/${preferredLocale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Set locale cookie for persistence
  const response = NextResponse.next();
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
