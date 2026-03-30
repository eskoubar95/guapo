/**
 * Validates returnUrl to prevent open redirects.
 * Only allows same-origin paths: must start with "/" and not "//".
 */
export function getSafeReturnUrl(
  returnUrl: string | null | undefined,
  fallback: string
): string {
  if (typeof returnUrl !== "string" || returnUrl.trim() === "") return fallback
  const path = returnUrl.trim()
  if (!path.startsWith("/") || path.startsWith("//")) return fallback
  return path
}

/**
 * Returns current in-app path (`/path?query#hash`) for post-auth redirects.
 * Falls back when not running in the browser.
 */
export function getCurrentReturnUrl(fallback: string): string {
  if (typeof window === "undefined") return fallback
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}
