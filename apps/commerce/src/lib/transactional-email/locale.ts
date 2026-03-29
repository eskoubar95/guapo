export function resolveTransactionalLocale(input?: string | null): "da" | "en" {
  const normalized = String(input ?? "")
    .trim()
    .toLowerCase();
  if (normalized.startsWith("en")) return "en";
  return "da";
}
