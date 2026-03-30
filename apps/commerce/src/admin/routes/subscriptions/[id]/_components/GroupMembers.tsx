import { Badge, Container, Heading } from "@medusajs/ui"
import { Link } from "react-router-dom"

import type { SubscriptionDetail } from "./subscription-detail.types"
import { StatusBadge } from "./shared"

export function GroupMembers({ subscription }: { subscription: SubscriptionDetail }) {
  if (subscription.group_members.length === 0) return null

  return (
    <Container className="p-0">
      <div className="border-b border-ui-border-base px-6 py-3">
        <div className="flex items-center gap-2">
          <Heading level="h2" className="text-sm font-semibold">
            Subscription group
          </Heading>
          <Badge color="blue">group: {subscription.group_id?.slice(0, 8)}…</Badge>
        </div>
      </div>
      <div className="px-6 py-4 space-y-2">
        <p className="text-xs text-ui-fg-muted">Other subscriptions in the same renewal group:</p>
        <div className="divide-y divide-ui-border-base rounded-md border border-ui-border-base">
          {subscription.group_members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <Link
                  to={`/subscriptions/${m.id}`}
                  className="font-mono text-xs text-ui-fg-interactive hover:underline"
                >
                  {m.id.slice(0, 12)}…
                </Link>
                <StatusBadge status={m.status} />
              </div>
              <div className="flex items-center gap-4 text-xs text-ui-fg-muted">
                <span>Every {m.cycle_weeks}w</span>
                <span>{m.delivery_count} deliveries</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}
