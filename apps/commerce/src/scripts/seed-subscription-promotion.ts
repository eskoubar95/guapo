import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

const PROMO_CODE = "SUBSCRIPTION-5PCT";

export default async function seedSubscriptionPromotion({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const log = (msg: string) =>
    (logger as { info?: (m: string) => void })?.info?.(msg) ??
    console.log(`[seed-subscription-promo] ${msg}`);

  const promotionModule = container.resolve(Modules.PROMOTION) as {
    listPromotions: (
      filters: { code?: string[] },
      config?: { take?: number }
    ) => Promise<
      Array<{
        id: string;
        code: string;
        application_method?: { value?: number };
      }>
    >;
    createPromotions: (
      data: unknown[]
    ) => Promise<Array<{ id: string; code: string }>>;
    updatePromotions: (
      data: Array<{ id: string; status?: string }>
    ) => Promise<unknown>;
  };

  const existing = await promotionModule.listPromotions(
    { code: [PROMO_CODE] },
    { take: 1 }
  );

  if (existing.length > 0) {
    log(
      `Promotion "${PROMO_CODE}" already exists (id=${existing[0].id}, value=${existing[0].application_method?.value ?? "?"}%). Skipping.`
    );
    return;
  }

  const [promotion] = await promotionModule.createPromotions([
    {
      code: PROMO_CODE,
      type: "standard",
      status: "active",
      is_automatic: true,
      application_method: {
        type: "percentage",
        target_type: "items",
        allocation: "each",
        max_quantity: 999,
        value: 5,
        currency_code: "dkk",
      },
    },
  ]);

  log(`Created promotion "${PROMO_CODE}" (id=${promotion.id})`);
}
