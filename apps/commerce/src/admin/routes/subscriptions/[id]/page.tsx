import { ArrowLeftMini, ArrowPath } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

type Subscription = {
  id: string
  customer_id: string
  status: string
  cycle_weeks: number
  next_renewal_at: string
  last_renewal_at: string | null
  delivery_count: number
  discount_percent: number
  variant_id: string
  quantity: number
  stripe_customer_id: string
  stripe_payment_method_id: string
  shipping_address: Record<string, unknown> | null
  billing_address: Record<string, unknown> | null
  shipping_option_id: string
  skip_next: boolean
  retry_count: number
  next_retry_at: string | null
}

function statusBadge(status: string) {
  const map: Record<string, "green" | "orange" | "red" | "grey"> = {
    active: "green",
    paused: "orange",
    on_hold: "red",
    cancelled: "grey",
    expired: "grey",
  }
  const color = map[status] ?? "grey"
  return <Badge color={color}>{status}</Badge>
}

function formatDate(s: string | null) {
  if (!s) return "–"
  try {
    return new Date(s).toLocaleString()
  } catch {
    return s
  }
}

async function callAction(
  base: string,
  id: string,
  action: "pause" | "resume" | "cancel" | "skip"
) {
  const body = action === "skip" ? { skip: true } : undefined
  const res = await fetch(`${base}/admin/subscriptions/${id}/${action}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json?.message ?? `Failed to ${action}`)
  }
  return res.json()
}

const SubscriptionDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)

  const loadSubscription = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/admin/subscriptions/${id}`, {
        credentials: "include",
      })
      if (res.ok) {
        const json = await res.json()
        setSubscription(json.subscription)
      } else {
        setSubscription(null)
      }
    } catch {
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  const handleAction = async (
    action: "pause" | "resume" | "cancel" | "skip"
  ) => {
    if (!id) return
    setActioning(action)
    try {
      await callAction(BASE, id, action)
      toast.success(`Subscription ${action}d successfully`)
      loadSubscription()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Failed to ${action}`)
    } finally {
      setActioning(null)
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="p-6">Loading…</div>
      </Container>
    )
  }

  if (!subscription) {
    return (
      <Container>
        <div className="p-6">
          <p>Subscription not found.</p>
          <Link to="/subscriptions">
            <Button variant="secondary" className="mt-4">
              <ArrowLeftMini />
              Back to list
            </Button>
          </Link>
        </div>
      </Container>
    )
  }

  const canPause = subscription.status === "active"
  const canResume = subscription.status === "paused"
  const canCancel =
    subscription.status === "active" || subscription.status === "paused"
  const canSkip = subscription.status === "active" && !subscription.skip_next

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-2 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/subscriptions">
              <Button variant="secondary" size="small">
                <ArrowLeftMini />
                Back
              </Button>
            </Link>
            <Heading level="h1">
              Subscription {subscription.id.slice(0, 8)}…
            </Heading>
            {statusBadge(subscription.status)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={loadSubscription}
              disabled={loading}
            >
              <ArrowPath />
              Refresh
            </Button>
            {canPause && (
              <Button
                size="small"
                variant="secondary"
                onClick={() => handleAction("pause")}
                disabled={!!actioning}
              >
                Pause
              </Button>
            )}
            {canResume && (
              <Button
                size="small"
                variant="secondary"
                onClick={() => handleAction("resume")}
                disabled={!!actioning}
              >
                Resume
              </Button>
            )}
            {canSkip && (
              <Button
                size="small"
                variant="secondary"
                onClick={() => handleAction("skip")}
                disabled={!!actioning}
              >
                Skip next
              </Button>
            )}
            {canCancel && (
              <Button
                size="small"
                variant="danger"
                onClick={() => handleAction("cancel")}
                disabled={!!actioning}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-4 md:grid-cols-2">
        <div className="rounded-lg border border-ui-border-base p-4">
          <Heading level="h2" className="mb-3">
            Details
          </Heading>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-medium text-ui-fg-muted">Customer</dt>
              <dd>{subscription.customer_id}</dd>
            </div>
            <div>
              <dt className="font-medium text-ui-fg-muted">Variant</dt>
              <dd>{subscription.variant_id}</dd>
            </div>
            <div>
              <dt className="font-medium text-ui-fg-muted">Quantity</dt>
              <dd>{subscription.quantity}</dd>
            </div>
            <div>
              <dt className="font-medium text-ui-fg-muted">Cycle</dt>
              <dd>Every {subscription.cycle_weeks} weeks</dd>
            </div>
            <div>
              <dt className="font-medium text-ui-fg-muted">Discount</dt>
              <dd>{subscription.discount_percent}%</dd>
            </div>
            <div>
              <dt className="font-medium text-ui-fg-muted">Deliveries</dt>
              <dd>{subscription.delivery_count}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-ui-border-base p-4">
          <Heading level="h2" className="mb-3">
            Renewal
          </Heading>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-medium text-ui-fg-muted">Next renewal</dt>
              <dd>{formatDate(subscription.next_renewal_at)}</dd>
            </div>
            <div>
              <dt className="font-medium text-ui-fg-muted">Last renewal</dt>
              <dd>{formatDate(subscription.last_renewal_at)}</dd>
            </div>
            {subscription.skip_next && (
              <div>
                <Badge color="yellow">Skip next delivery</Badge>
              </div>
            )}
            {subscription.retry_count > 0 && (
              <div>
                <dt className="font-medium text-ui-fg-muted">Retry</dt>
                <dd>
                  Count: {subscription.retry_count}, Next:{" "}
                  {formatDate(subscription.next_retry_at)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg border border-ui-border-base p-4 md:col-span-2">
          <Heading level="h2" className="mb-3">
            Stripe
          </Heading>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="font-medium text-ui-fg-muted">Customer ID</dt>
              <dd className="font-mono text-xs">{subscription.stripe_customer_id}</dd>
            </div>
            <div>
              <dt className="font-medium text-ui-fg-muted">Payment method</dt>
              <dd className="font-mono text-xs">
                {subscription.stripe_payment_method_id}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Container>
  )
}

export default SubscriptionDetailPage
