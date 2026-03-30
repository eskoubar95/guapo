import { ShoppingBag, Tag } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"

import type { SubscriptionDetail } from "./subscription-detail.types"

export function ProductCard({ subscription }: { subscription: SubscriptionDetail }) {
  return (
    <Container className="p-0">
      <div className="flex items-center gap-2 border-b border-ui-border-base px-6 py-3">
        <ShoppingBag className="text-ui-fg-muted" />
        <Heading level="h2" className="text-sm font-semibold">
          Product
        </Heading>
      </div>
      <div className="px-6 py-4">
        <div className="flex gap-3">
          {subscription.product_thumbnail ? (
            <img
              src={subscription.product_thumbnail}
              alt={subscription.product_title}
              className="h-14 w-14 rounded-md object-cover border border-ui-border-base flex-shrink-0"
            />
          ) : (
            <div className="h-14 w-14 rounded-md bg-ui-bg-subtle border border-ui-border-base flex items-center justify-center flex-shrink-0">
              <Tag className="text-ui-fg-muted" />
            </div>
          )}
          <div className="space-y-1 text-sm">
            {subscription.product_title ? (
              <div className="font-medium">{subscription.product_title}</div>
            ) : null}
            {subscription.variant_title ? (
              <div className="text-ui-fg-muted">{subscription.variant_title}</div>
            ) : null}
            <div className="font-mono text-xs text-ui-fg-subtle">{subscription.variant_id}</div>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <Text size="small" weight="plus" className="text-ui-fg-muted">
              Quantity
            </Text>
            <div>{subscription.quantity}</div>
          </div>
          <div>
            <Text size="small" weight="plus" className="text-ui-fg-muted">
              Cycle
            </Text>
            <div>Every {subscription.cycle_weeks} weeks</div>
          </div>
          <div>
            <Text size="small" weight="plus" className="text-ui-fg-muted">
              Discount
            </Text>
            <div>{subscription.discount_percent}%</div>
          </div>
        </dl>
      </div>
    </Container>
  )
}
