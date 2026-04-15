const cmsBase = (process.env.PAYLOAD_API_URL ?? process.env.NEXT_PUBLIC_PAYLOAD_API_URL ?? "").replace(/\/$/, "");

export interface PayloadConcernListing {
  value: string;
  label: string;
  meta?: { title: string | null; description: string | null };
}

export async function fetchPayloadConcernByValue(
  value: string,
  locale: string,
): Promise<PayloadConcernListing | null> {
  if (!cmsBase) return null;
  const v = value.trim();
  if (!v) return null;

  try {
    const params = new URLSearchParams({ locale: locale === "en" ? "en" : "da" });
    const res = await fetch(`${cmsBase}/api/storefront/concern/${encodeURIComponent(v)}?${params}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PayloadConcernListing;
  } catch {
    return null;
  }
}
