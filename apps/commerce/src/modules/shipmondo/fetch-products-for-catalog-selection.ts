import { fetchShipmondoCarriers } from "./fetch-carriers";
import { fetchShipmondoProducts } from "./fetch-products";
import { mergeShipmondoProductsByCode } from "./lib/merge-shipmondo-product-lists";
import type { ShipmondoProduct } from "./types";

export type CatalogSelectionRow = { code: string; carrierCode?: string };

/**
 * Fetches Shipmondo products for catalog apply: per-carrier calls when `carrierCode` is present
 * on rows (wizard), otherwise merges GET /products for each account carrier, then a final unscoped fetch if needed.
 */
export async function fetchProductsForCatalogSelection(params: {
  apiUser: string;
  apiKey: string;
  sandbox: boolean;
  receiver: string;
  sender?: string;
  servicePointOnly: boolean;
  selectionRows: CatalogSelectionRow[];
}): Promise<ShipmondoProduct[]> {
  const { apiUser, apiKey, sandbox, receiver, sender, servicePointOnly, selectionRows } = params;

  const fetchOne = (carrierCode?: string) =>
    fetchShipmondoProducts({
      apiUser,
      apiKey,
      sandbox,
      countryCode: receiver,
      senderCountryCode: sender,
      carrierCode,
      servicePointOnly,
    });

  const distinctCarriers = [
    ...new Set(
      selectionRows.map((r) => r.carrierCode?.trim().toLowerCase()).filter((c): c is string => Boolean(c))
    ),
  ];

  const lists: ShipmondoProduct[][] = [];

  if (distinctCarriers.length > 0) {
    const perCarrier = await Promise.all(distinctCarriers.map((c) => fetchOne(c)));
    lists.push(...perCarrier);
    if (selectionRows.some((r) => !r.carrierCode?.trim())) {
      lists.push(await fetchOne(undefined));
    }
  } else {
    try {
      const carriers = await fetchShipmondoCarriers({ apiUser, apiKey, sandbox });
      const codes = carriers.map((c) => c.code.trim().toLowerCase()).filter(Boolean);
      if (codes.length > 0) {
        const perCarrier = await Promise.all(codes.map((c) => fetchOne(c)));
        lists.push(...perCarrier);
      }
    } catch {
      lists.push(await fetchOne(undefined));
    }
  }

  let merged = mergeShipmondoProductsByCode(lists);
  if (merged.length === 0) {
    merged = mergeShipmondoProductsByCode([merged, await fetchOne(undefined)]);
  }
  return merged;
}
