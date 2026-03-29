import { ArrowLeftMini, ArrowPath } from "@medusajs/icons"
import { Badge, Button, Container, Heading } from "@medusajs/ui"
import { Link } from "react-router-dom"

import type { SubscriptionDetail } from "./subscription-detail.types"
import { StatusBadge } from "./shared"

type Props = {
  subscription: SubscriptionDetail
  loading: boolean
  actioning: string | null
  onRefresh: () => void
  onAction: (
    action: "pause" | "resume" | "cancel" | "skip" | "retry",
    body?: Record<string, unknown>
  ) => void
}

export function SubscriptionHeader({
  subscription,
  loading,
  actioning,
  onRefresh,
  onAction,
}: Props) {
  const canPause = subscription.status === "active"
  const canResume = subscription.status === "paused" || subscription.status === "on_hold"
  const canCancel =
    subscription.status === "active" ||
    subscription.status === "paused" ||
    subscription.status === "on_hold"
  const canSkip = subscription.status === "active" && !subscription.skip_next
  const canRetry = subscription.status === "on_hold" || subscription.retry_count > 0

  return (
    <Container className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/subscriptions">
            <Button variant="secondary" size="small">
              <ArrowLeftMini />
              Back
            </Button>
          </Link>
          <Heading level="h1" className="font-semibold">
            Subscription{" "}
            <span className="font-mono text-ui-fg-muted">
              {subscription.id.slice(0, 12)}…
            </span>
          </Heading>
          <StatusBadge status={subscription.status} />
          {subscription.group_id ? <Badge color="blue">Group</Badge> : null}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="small" onClick={onRefresh} disabled={loading}>
            <ArrowPath />
            Refresh
          </Button>
          {canPause ? (
            <Button
              size="small"
              variant="secondary"
              onClick={() => onAction("pause")}
              disabled={!!actioning}
            >
              Pause
            </Button>
          ) : null}
          {canResume ? (
            <Button
              size="small"
              variant="secondary"
              onClick={() => onAction("resume")}
              disabled={!!actioning}
            >
              Resume
            </Button>
          ) : null}
          {canSkip ? (
            <Button
              size="small"
              variant="secondary"
              onClick={() => onAction("skip", { skip: true })}
              disabled={!!actioning}
            >
              Skip next
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              size="small"
              variant="danger"
              onClick={() => onAction("cancel")}
              disabled={!!actioning}
            >
              Cancel
            </Button>
          ) : null}
          {canRetry ? (
            <Button
              size="small"
              variant="secondary"
              onClick={() => onAction("retry")}
              disabled={!!actioning}
            >
              Retry now
            </Button>
          ) : null}
        </div>
      </div>
    </Container>
  )
}
