import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { MedusaError, Modules } from "@medusajs/framework/utils"

const PROMO_CODE = "SUBSCRIPTION-5PCT"
const DEFAULT_DISCOUNT_PCT = 5

type CartItem = {
  id: string
  unit_price?: number
  quantity?: number
  metadata?: Record<string, unknown> | null
  adjustments?: Array<{ id: string; code?: string | null }> | null
}
type Cart = {
  id: string
  customer_id?: string | null
  items?: CartItem[] | null
}

/**
 * Validate hook for completeCartWorkflow:
 * 1. Enforce logged-in customer for subscription carts
 * 2. Apply SUBSCRIPTION-5PCT LineItemAdjustments to subscription items
 *    so the resulting order inherits correct discount_total
 */
completeCartWorkflow.hooks.validate(
  async ({ cart }: { input: { id: string }; cart: Cart }, { container }) => {
    const items = cart?.items ?? []
    const subscriptionItems = items.filter(
      (item) =>
        item?.metadata &&
        typeof (item.metadata as Record<string, unknown>).subscription_cycle === "number" &&
        ((item.metadata as Record<string, unknown>).subscription_cycle as number) > 0
    )

    if (subscriptionItems.length === 0) return

    // 1. Auth enforcement
    const customerId = cart?.customer_id
    if (!customerId || typeof customerId !== "string" || customerId.trim() === "") {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "Account required for subscription checkout. Please log in or register."
      )
    }

    // 2. Apply subscription discount adjustments (safety net before order creation)
    let discountPct = DEFAULT_DISCOUNT_PCT
    try {
      const promoModule = container.resolve(Modules.PROMOTION) as {
        listPromotions: (
          f: { code?: string[] },
          c?: { take?: number; relations?: string[] }
        ) => Promise<Array<{ application_method?: { value?: number } | null }>>
      }
      const promos = await promoModule.listPromotions(
        { code: [PROMO_CODE] },
        { take: 1, relations: ["application_method"] }
      )
      const val = promos?.[0]?.application_method?.value
      if (typeof val === "number" && val > 0) discountPct = val
    } catch {
      /* use default */
    }

    const cartModule = container.resolve(Modules.CART) as {
      addLineItemAdjustments: (
        data: Array<{ item_id: string; code: string; amount: number; description?: string }>
      ) => Promise<unknown>
    }

    const toAdd: Array<{ item_id: string; code: string; amount: number; description: string }> = []
    for (const item of subscriptionItems) {
      const hasAdj = (item.adjustments ?? []).some((adj) => adj.code === PROMO_CODE)
      if (hasAdj) continue
      const amount = (item.unit_price ?? 0) * (item.quantity ?? 1) * (discountPct / 100)
      if (amount > 0) {
        toAdd.push({
          item_id: item.id,
          code: PROMO_CODE,
          amount,
          description: `Abonnementsrabat ${discountPct}%`,
        })
      }
    }

    if (toAdd.length > 0) {
      await cartModule.addLineItemAdjustments(toAdd)
    }
  }
)
