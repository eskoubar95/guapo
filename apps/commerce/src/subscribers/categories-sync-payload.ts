import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import {
  handleToDisplayName,
  uniquePayloadCategoryHandle,
} from "../lib/payload-slug-helpers";
import { PAYLOAD_MODULE } from "../modules/payload";
import type PayloadModuleService from "../modules/payload/service";
import { syncPayloadCategoriesWorkflow } from "../workflows/sync-payload-categories";
import { updatePayloadCategoriesWorkflow } from "../workflows/update-payload-categories";

/**
 * Categories sync follows the same pattern as products (Medusa docs):
 * - Determine "already in Payload" by medusa_id (like products use metadata.payload_id).
 * - Sync only missing categories. Handle is made unique by including medusa_id suffix.
 */

type MedusaCategory = { id: string; handle?: string; name?: string; parent_category_id?: string | null };

export default async function categoriesSyncPayloadHandler({ container }: SubscriberArgs) {
  const productModule = container.resolve(Modules.PRODUCT) as {
    listProductCategories: (
      filters?: Record<string, unknown>,
      config?: { take?: number; skip?: number; select?: string[] }
    ) => Promise<MedusaCategory[]>;
  };
  const payloadService = container.resolve<PayloadModuleService>(PAYLOAD_MODULE);

  const raw =
    (await productModule.listProductCategories(
      {},
      { take: 200, select: ["id", "name", "handle", "parent_category_id"] }
    )) ?? [];
  if (raw.length === 0) {
    console.warn("[Payload sync] No product categories in Medusa. Run seed or create categories in Admin.");
    return;
  }

  const { docs } = await payloadService.find("categories", { limit: 1000 });
  const existingMedusaIds = new Set(
    (docs ?? [])
      .map((d) => (d as Record<string, unknown>).medusa_id as string | undefined)
      .filter(Boolean)
  );

  const missing = raw.filter((c) => !existingMedusaIds.has(c.id));
  const roots = missing.filter((c) => !c.parent_category_id);
  const children = missing.filter((c) => Boolean(c.parent_category_id));

  if (roots.length > 0) {
    await syncPayloadCategoriesWorkflow(container).run({
      input: {
        items: roots.map((c) => {
          const displayName = (c.name ?? "").trim() || handleToDisplayName(c.handle ?? "");
          return {
            medusa_id: c.id,
            handle: uniquePayloadCategoryHandle(c.handle ?? c.name ?? "", c.id),
            name: displayName || "Category",
          };
        }),
      },
    });
  }

  if (children.length > 0) {
    const { docs: docsAfter } = await payloadService.find("categories", { limit: 1000 });
    const parentMap = new Map<string, number>(
      (docsAfter ?? [])
        .map((d) => {
          const r = d as Record<string, unknown>;
          const mid = r.medusa_id as string | undefined;
          const id = r.id as number | undefined;
          return mid != null && id != null ? [mid, id] : [];
        })
        .filter((pair): pair is [string, number] => pair.length === 2)
    );
    const childrenWithParent = children
      .map((c) => {
        const parentId = c.parent_category_id ? parentMap.get(c.parent_category_id) : undefined;
        if (parentId == null) return null;
        const displayName = (c.name ?? "").trim() || handleToDisplayName(c.handle ?? "");
        return {
          medusa_id: c.id,
          handle: uniquePayloadCategoryHandle(c.handle ?? c.name ?? "", c.id),
          name: displayName || "Category",
          parent: parentId,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item != null);
    if (childrenWithParent.length > 0) {
      await syncPayloadCategoriesWorkflow(container).run({
        input: { items: childrenWithParent },
      });
    }
  }

  const { docs: allDocs } = await payloadService.find("categories", { limit: 1000 });
  const medusaIdToPayloadId = new Map<string, number>(
    (allDocs ?? [])
      .map((d) => {
        const r = d as Record<string, unknown>;
        const mid = r.medusa_id as string | undefined;
        const id = r.id as number | undefined;
        return mid != null && id != null ? [mid, id] : [];
      })
      .filter((pair): pair is [string, number] => pair.length === 2)
  );

  const updates = raw
    .filter((c) => medusaIdToPayloadId.has(c.id))
    .map((c) => {
      const payloadId = String(medusaIdToPayloadId.get(c.id)!);
      const parent =
        c.parent_category_id != null ? medusaIdToPayloadId.get(c.parent_category_id) ?? null : null;
      return {
        payloadId,
        handle: uniquePayloadCategoryHandle(c.handle ?? c.name ?? "", c.id),
        parent,
      };
    })
    .filter((u) => u.payloadId);

  if (updates.length > 0) {
    await updatePayloadCategoriesWorkflow(container).run({ input: { updates } });
  }
}

export const config: SubscriberConfig = {
  event: "categories.sync-payload",
};
