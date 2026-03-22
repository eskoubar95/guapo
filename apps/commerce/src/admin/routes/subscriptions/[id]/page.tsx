import { ArrowLeftMini } from "@medusajs/icons"
import { Button, Container, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { AddressesSection } from "./_components/AddressesSection"
import { CustomerCard } from "./_components/CustomerCard"
import { GroupMembers } from "./_components/GroupMembers"
import { OrdersTable } from "./_components/OrdersTable"
import { ProductCard } from "./_components/ProductCard"
import { RenewalCard } from "./_components/RenewalCard"
import { callSubscriptionAction } from "./_components/subscription-actions"
import type { SubscriptionDetail } from "./_components/subscription-detail.types"
import { SubscriptionHeader } from "./_components/SubscriptionHeader"
import { StripeCard } from "./_components/StripeCard"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

const SubscriptionDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null)
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
    action: "pause" | "resume" | "cancel" | "skip",
    body?: Record<string, unknown>
  ) => {
    if (!id) return
    setActioning(action)
    try {
      await callSubscriptionAction(BASE, id, action, body)
      const labels: Record<string, string> = {
        pause: "Subscription paused",
        resume: "Subscription resumed",
        cancel: "Subscription cancelled",
        skip: "Next delivery will be skipped",
      }
      toast.success(labels[action] ?? `Done`)
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
        <div className="p-6 text-sm text-ui-fg-muted">Loading…</div>
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

  return (
    <div className="flex flex-col gap-4 pb-8">
      <SubscriptionHeader
        subscription={subscription}
        loading={loading}
        actioning={actioning}
        onRefresh={loadSubscription}
        onAction={handleAction}
      />

      <div className="grid gap-4 px-0 md:grid-cols-2">
        <CustomerCard subscription={subscription} />
        <ProductCard subscription={subscription} />
        <RenewalCard subscription={subscription} />
        <StripeCard subscription={subscription} />
      </div>

      <OrdersTable subscription={subscription} />
      <AddressesSection subscription={subscription} />
      <GroupMembers subscription={subscription} />
    </div>
  )
}

export default SubscriptionDetailPage
