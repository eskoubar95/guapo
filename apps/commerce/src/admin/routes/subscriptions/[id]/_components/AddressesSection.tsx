import { Container, Heading } from "@medusajs/ui"

import type { SubscriptionDetail } from "./subscription-detail.types"
import { AddressBlock } from "./shared"

export function AddressesSection({ subscription }: { subscription: SubscriptionDetail }) {
  if (!subscription.shipping_address && !subscription.billing_address) return null

  return (
    <Container className="p-0">
      <div className="border-b border-ui-border-base px-6 py-3">
        <Heading level="h2" className="text-sm font-semibold">
          Addresses
        </Heading>
      </div>
      <div className="grid gap-6 px-6 py-4 md:grid-cols-2">
        <AddressBlock title="Shipping address" addr={subscription.shipping_address} />
        <AddressBlock title="Billing address" addr={subscription.billing_address} />
      </div>
    </Container>
  )
}
