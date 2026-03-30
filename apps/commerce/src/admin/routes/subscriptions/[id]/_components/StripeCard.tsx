import { CurrencyDollar } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"

import type { SubscriptionDetail } from "./subscription-detail.types"

export function StripeCard({ subscription }: { subscription: SubscriptionDetail }) {
  return (
    <Container className="p-0">
      <div className="flex items-center gap-2 border-b border-ui-border-base px-6 py-3">
        <CurrencyDollar className="text-ui-fg-muted" />
        <Heading level="h2" className="text-sm font-semibold">
          Stripe
        </Heading>
      </div>
      <div className="px-6 py-4 space-y-3 text-sm">
        <div>
          <Text size="small" weight="plus" className="text-ui-fg-muted">
            Customer ID
          </Text>
          <div className="font-mono text-xs">{subscription.stripe_customer_id || "–"}</div>
        </div>
        <div>
          <Text size="small" weight="plus" className="text-ui-fg-muted">
            Payment method
          </Text>
          <div className="font-mono text-xs">{subscription.stripe_payment_method_id || "–"}</div>
        </div>
      </div>
    </Container>
  )
}
