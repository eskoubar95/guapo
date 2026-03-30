/**
 * Routes that render without global header/footer (login, register, checkout).
 * Must match client-side pathname — do not rely on request headers for SPA navigations.
 */
export function isMinimalShellPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  return last === "login" || last === "register" || last === "checkout";
}
