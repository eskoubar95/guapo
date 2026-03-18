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
