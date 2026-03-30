export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Unique handle for Payload: [a-z0-9-] only, always ends with -{idSlug} so no duplicates. */
export function uniquePayloadCategoryHandle(nameOrHandle: string, medusaId: string): string {
  const slug = toSlug(nameOrHandle || "category");
  const idSlug = medusaId.replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 12);
  const base = slug.length > 0 ? slug : "category";
  const out = idSlug ? `${base}-${idSlug}` : base;
  return out.slice(0, 100);
}

/** Turn handle into display name when name is missing: "skincare" -> "Skincare", "eye-cream" -> "Eye cream". */
export function handleToDisplayName(handle: string): string {
  if (!handle || !handle.trim()) return "Category";
  return handle
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
