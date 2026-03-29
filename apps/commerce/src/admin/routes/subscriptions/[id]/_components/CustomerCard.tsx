import { User } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"

import type { SubscriptionDetail } from "./subscription-detail.types"

export function CustomerCard({ subscription }: { subscription: SubscriptionDetail }) {
  return (
    <Container className="p-0">
      <div className="flex items-center gap-2 border-b border-ui-border-base px-6 py-3">
        <User className="text-ui-fg-muted" />
        <Heading level="h2" className="text-sm font-semibold">
          Customer
        </Heading>
      </div>
      <div className="px-6 py-4 space-y-3 text-sm">
        {subscription.customer_name ? (
          <div>
            <Text size="small" weight="plus" className="text-ui-fg-muted">
              Name
            </Text>
            <a
              href={`/app/customers/${subscription.customer_id}`}
              className="text-ui-fg-interactive hover:underline"
            >
              {subscription.customer_name}
            </a>
          </div>
        ) : null}
        {subscription.customer_email ? (
          <div>
            <Text size="small" weight="plus" className="text-ui-fg-muted">
              Email
            </Text>
            <div>{subscription.customer_email}</div>
          </div>
        ) : null}
        <div>
          <Text size="small" weight="plus" className="text-ui-fg-muted">
            Customer ID
          </Text>
          <div className="font-mono text-xs text-ui-fg-muted">{subscription.customer_id}</div>
        </div>
      </div>
    </Container>
  )
}
