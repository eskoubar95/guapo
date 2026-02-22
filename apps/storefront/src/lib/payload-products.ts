/**
 * Payload CMS — product content for storefront PDP.
 * Fetches from PAYLOAD_API_URL/api/products by handle.
 * Enriches Medusa product data with CMS fields (title override, description, ingredients, skin types, concerns, etc.).
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

function getLocalized(value: unknown, locale: string): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const obj = value as Record<string, string>;
    return obj[locale] ?? obj.da ?? obj.en ?? "";
  }
  return "";
}

/** Recursively extract plain text from Lexical JSON (handles nested nodes). */
function lexicalToPlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const obj = value as Record<string, unknown>;
  if ("text" in obj && typeof obj.text === "string") return obj.text;
  const children = (obj.children ?? (obj as { root?: { children?: unknown[] } }).root?.children) as unknown[] | undefined;
  const arr = Array.isArray(children) ? children : [];
  const parts = arr
    .filter((c): c is object => c != null && typeof c === "object")
    .map((c) => lexicalToPlainText(c));
  const sep = obj.type === "root" ? "\n\n" : "";
  return parts.join(sep);
}

export interface ProductSpecifications {
  volume?: string;
  sku?: string;
  ean?: string;
  manufacturer?: string;
  manufacturerContact?: string;
}

export interface PayloadProductEnrichment {
  id: string;
  title?: string;
  description?: string;
  subtitle?: string;
  brandName?: string;
  keyIngredients: { name: string; benefit: string }[];
  ingredients: { name: string; inciName?: string }[];
  skinTypes: { da: string; en: string }[];
  concerns: { da: string; en: string }[];
  specifications?: ProductSpecifications;
}

/**
 * Fetch Payload product by handle. Returns null if CMS not configured or product not found.
 */
export async function fetchPayloadProductByHandle(
  handle: string,
  locale: string
): Promise<PayloadProductEnrichment | null> {
  if (!PAYLOAD_URL) return null;

  const key = `payload:product:${handle}:${locale}`;
  const cached = getCached<PayloadProductEnrichment | null>(key);
  if (cached !== null) return cached;

  try {
    const params = new URLSearchParams({
      locale,
      "fallback-locale": "da",
    });
    // Use custom storefront endpoint – Payload Local API ensures skinTypes/concerns are correctly populated
    const res = await fetch(`${PAYLOAD_URL}/api/storefront/product/${encodeURIComponent(handle)}?${params}`, {
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale === "da" ? "da,en" : "en,da",
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { docs?: Array<Record<string, unknown>> };
    const doc = json.docs?.[0];
    if (!doc) return null;

    const localeKey = locale as "da" | "en";

    const titleVal = doc.title;
    const title = getLocalized(titleVal, localeKey);

    const descVal = doc.description;
    let description = "";
    if (typeof descVal === "string") {
      description = descVal;
    } else if (descVal && typeof descVal === "object") {
      const obj = descVal as Record<string, unknown>;
      const rich = obj.root ? descVal : obj[localeKey] ?? obj.da ?? obj.en;
      description = lexicalToPlainText(rich).trim();
      if (!description) description = lexicalToPlainText(descVal).trim();
    }

    const subtitleVal = doc.subtitle;
    const subtitle = typeof subtitleVal === "string" ? subtitleVal : getLocalized(subtitleVal, localeKey);

    const specs = doc.specifications as Record<string, unknown> | undefined;
    const brandRel = specs?.brand;
    let brandName = "";
    if (brandRel && typeof brandRel === "object") {
      const b = brandRel as { displayName?: unknown; name?: unknown; brandKey?: string };
      brandName = getLocalized(b.displayName ?? b.name, localeKey) || b.brandKey || "";
    }
    const specifications: ProductSpecifications = specs
      ? {
          volume: typeof specs.volume === "string" ? specs.volume : undefined,
          sku: typeof specs.sku === "string" ? specs.sku : undefined,
          ean: typeof specs.ean === "string" ? specs.ean : undefined,
          manufacturer: typeof specs.manufacturer === "string" ? specs.manufacturer : undefined,
          manufacturerContact: typeof specs.manufacturerContact === "string" ? specs.manufacturerContact : undefined,
        }
      : {};

    const keyIngsRaw = doc.keyIngredients;
    const keyIngs = Array.isArray(keyIngsRaw)
      ? keyIngsRaw.filter((ing): ing is Record<string, unknown> => ing != null && typeof ing === "object")
      : [];
    const keyIngredients = keyIngs
      .map((ing) => {
        const nameVal = ing.name;
        const name =
          getLocalized(nameVal, localeKey) || getLocalized(nameVal, "en") || String(ing.inciName ?? "").trim();
        const benefitVal = ing.benefit;
        const benefit = getLocalized(benefitVal, localeKey) || getLocalized(benefitVal, "en") || "";
        return { name, benefit };
      })
      .filter((ing) => ing.name.length > 0);

    const fullIngsRaw = doc.ingredients;
    const fullIngs = Array.isArray(fullIngsRaw)
      ? fullIngsRaw.filter((ing): ing is Record<string, unknown> => ing != null && typeof ing === "object")
      : [];
    const ingredients = fullIngs
      .map((ing) => {
        const nameVal = ing.name;
        const name =
          getLocalized(nameVal, localeKey) || getLocalized(nameVal, "en") || String(ing.inciName ?? "").trim();
        const inciName = typeof ing.inciName === "string" ? ing.inciName.trim() : undefined;
        return { name: name || (inciName ?? ""), inciName };
      })
      .filter((ing) => (ing.inciName || ing.name).length > 0);

    function extractRelationLabel(item: Record<string, unknown>, localeKey: string): { da: string; en: string } {
      const labelVal = item.label ?? item.name;
      const valueStr = typeof item.value === "string" ? item.value : String(item.value ?? "");
      const da = getLocalized(labelVal, "da") || valueStr;
      const en = getLocalized(labelVal, "en") || valueStr;
      return { da, en };
    }

    const skinRels = (doc.skinTypes as Array<Record<string, unknown> | number> | undefined) ?? [];
    const skinTypes = skinRels
      .filter((s): s is Record<string, unknown> => s != null && typeof s === "object")
      .map((s) => extractRelationLabel(s, localeKey))
      .filter((s) => s.da.length > 0 || s.en.length > 0);

    const concernRels = (doc.concerns as Array<Record<string, unknown> | number> | undefined) ?? [];
    const concerns = concernRels
      .filter((c): c is Record<string, unknown> => c != null && typeof c === "object")
      .map((c) => extractRelationLabel(c, localeKey))
      .filter((c) => c.da.length > 0 || c.en.length > 0);

    const result: PayloadProductEnrichment = {
      id: doc.id as string,
      title: title || undefined,
      description: description || undefined,
      subtitle: subtitle || undefined,
      brandName: brandName || undefined,
      keyIngredients,
      ingredients,
      skinTypes,
      concerns,
      specifications: Object.values(specifications || {}).some(Boolean) ? specifications : undefined,
    };

    setCache(key, result);
    return result;
  } catch {
    return null;
  }
}
