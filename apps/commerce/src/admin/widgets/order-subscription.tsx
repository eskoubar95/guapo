import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps } from "@medusajs/framework/types"
import { Badge, Button, Container, Heading } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { useCallback, useEffect, useState } from "react"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

type Subscription = {
  id: string
  status: string
  cycle_weeks: number
  next_renewal_at: string
  delivery_count: number
}

const OrderSubscriptionWidget = ({ data: order }: DetailWidgetProps) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  const loadSubscriptions = useCallback(async () => {
    if (!order?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `${BASE}/admin/orders/${order.id}/subscriptions`,
        { credentials: "include" }
      )
      if (res.ok) {
        const json = await res.json()
        setSubscriptions(json.subscriptions ?? [])
      } else {
        setSubscriptions([])
      }
    } catch {
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }, [order?.id])

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  if (!order?.id || loading) {
    return loading ? (
      <Container className="p-4">
        <p className="text-sm text-ui-fg-muted">Loading subscription info…</p>
      </Container>
    ) : null
  }

  if (subscriptions.length === 0) {
    return <></>
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-3">
          Subscription
        </Heading>
        <p className="mb-3 text-sm text-ui-fg-muted">
          This order is linked to {subscriptions.length} subscription
          {subscriptions.length > 1 ? "s" : ""}.
        </p>
        <div className="space-y-2">
          {subscriptions.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ui-border-base p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  color={
                    s.status === "active"
                      ? "green"
                      : s.status === "paused"
                        ? "orange"
                        : "grey"
                  }
                >
                  {s.status}
                </Badge>
                <span className="text-sm">
                  Every {s.cycle_weeks} weeks • Delivery #{s.delivery_count}
                </span>
                <span className="text-xs text-ui-fg-muted">
                  Next: {new Date(s.next_renewal_at).toLocaleDateString()}
                </span>
              </div>
              <Link to={`/subscriptions/${s.id}`}>
                <Button variant="secondary" size="small">
                  View subscription
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderSubscriptionWidget
