import { ArrowPath } from "@medusajs/icons"
import { Badge, Container, Heading, Text } from "@medusajs/ui"

import type { SubscriptionDetail } from "./subscription-detail.types"
import { formatDate } from "./shared"

function daysUntilExpiration(onHoldAt: string | null | undefined) {
  if (!onHoldAt) return null
  const onHoldDate = new Date(onHoldAt)
  if (Number.isNaN(onHoldDate.getTime())) return null
  const expiry = new Date(onHoldDate)
  expiry.setDate(expiry.getDate() + 30)
  const diffMs = expiry.getTime() - Date.now()
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)))
}

export function RenewalCard({ subscription }: { subscription: SubscriptionDetail }) {
  const daysLeft = daysUntilExpiration(subscription.on_hold_at)

  return (
    <Container className="p-0">
      <div className="flex items-center gap-2 border-b border-ui-border-base px-6 py-3">
        <ArrowPath className="text-ui-fg-muted" />
        <Heading level="h2" className="text-sm font-semibold">
          Renewal
        </Heading>
      </div>
      <div className="px-6 py-4 space-y-3 text-sm">
        <div>
          <Text size="small" weight="plus" className="text-ui-fg-muted">
            Next renewal
          </Text>
          <div>{formatDate(subscription.next_renewal_at)}</div>
        </div>
        <div>
          <Text size="small" weight="plus" className="text-ui-fg-muted">
            Last renewal
          </Text>
          <div>{formatDate(subscription.last_renewal_at)}</div>
        </div>
        <div>
          <Text size="small" weight="plus" className="text-ui-fg-muted">
            Deliveries
          </Text>
          <div>{subscription.delivery_count}</div>
        </div>
        {subscription.skip_next ? (
          <Badge color="orange">Next delivery will be skipped</Badge>
        ) : null}
        {subscription.retry_count > 0 ? (
          <div className="rounded-md bg-ui-bg-subtle border border-ui-border-base px-3 py-2 space-y-1">
            <div className="flex items-center gap-2">
              <Badge color="red">Payment retry</Badge>
              <span className="text-xs text-ui-fg-muted">Attempt {subscription.retry_count}</span>
            </div>
            <div className="text-xs text-ui-fg-muted">
              Next retry: {formatDate(subscription.next_retry_at)}
            </div>
          </div>
        ) : null}
        {subscription.status === "on_hold" && subscription.on_hold_at ? (
          <div className="rounded-md bg-ui-bg-subtle border border-ui-border-base px-3 py-2 space-y-1">
            <div className="flex items-center gap-2">
              <Badge color="red">On hold since {formatDate(subscription.on_hold_at)}</Badge>
            </div>
            {daysLeft !== null ? (
              <div className="text-xs text-ui-fg-muted">
                Auto-expire in {daysLeft} day(s)
              </div>
            ) : null}
          </div>
        ) : null}
        {subscription.last_failure_reason ? (
          <div className="rounded-md bg-ui-bg-subtle border border-ui-border-base px-3 py-2 text-xs text-ui-fg-muted">
            Last failure reason: {subscription.last_failure_reason}
          </div>
        ) : null}
      </div>
    </Container>
  )
}
