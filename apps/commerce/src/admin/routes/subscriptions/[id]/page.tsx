import { ArrowLeftMini, ArrowPath, BuildingTax, CurrencyDollar, ShoppingBag, Tag, User } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

type OrderSummary = {
  id: string
  status?: string
  payment_status?: string
  total?: number
  created_at?: string
  metadata?: Record<string, unknown>
}

type GroupMember = {
  id: string
  status: string
  cycle_weeks: number
  delivery_count: number
  variant_id: string
}

type Subscription = {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  product_title: string
  variant_title: string
  product_thumbnail: string | null
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
  group_id: string | null
  linked_orders: OrderSummary[]
  group_members: GroupMember[]
}

const STATUS_COLORS: Record<string, "green" | "orange" | "red" | "grey"> = {
  active: "green",
  paused: "orange",
  on_hold: "red",
  cancelled: "grey",
  expired: "grey",
}

function StatusBadge({ status }: { status: string }) {
  return <Badge color={STATUS_COLORS[status] ?? "grey"}>{status}</Badge>
}

function OrderStatusBadge({ status }: { status?: string }) {
  const map: Record<string, "green" | "orange" | "red" | "grey" | "blue"> = {
    completed: "green",
    pending: "orange",
    cancelled: "red",
    requires_action: "red",
    captured: "green",
    not_paid: "grey",
    awaiting: "orange",
  }
  const s = status ?? "pending"
  return <Badge color={map[s] ?? "grey"}>{s}</Badge>
}

function formatDate(s: string | null | undefined) {
  if (!s) return "–"
  try {
    return new Date(s).toLocaleString("da-DK", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return s
  }
}

function formatCurrency(amount?: number) {
  if (amount == null) return "–"
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

function AddressBlock({ title, addr }: { title: string; addr: Record<string, unknown> | null }) {
  if (!addr) return null
  const parts = [
    addr.first_name && addr.last_name ? `${addr.first_name} ${addr.last_name}` : null,
    addr.address_1 as string | undefined,
    addr.address_2 as string | undefined,
    [addr.postal_code, addr.city].filter(Boolean).join(" ") || null,
    addr.country_code ? String(addr.country_code).toUpperCase() : null,
  ].filter(Boolean)
  if (!parts.length) return null
  return (
    <div>
      <Text size="small" weight="plus" className="text-ui-fg-muted mb-1">
        {title}
      </Text>
      <div className="text-sm space-y-0.5">
        {parts.map((p, i) => (
          <div key={i}>{p as string}</div>
        ))}
      </div>
    </div>
  )
}

async function callAction(
  base: string,
  id: string,
  action: "pause" | "resume" | "cancel" | "skip",
  body?: Record<string, unknown>
) {
  const res = await fetch(`${base}/admin/subscriptions/${id}/${action}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error((json as { message?: string })?.message ?? `Failed to ${action}`)
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
    action: "pause" | "resume" | "cancel" | "skip",
    body?: Record<string, unknown>
  ) => {
    if (!id) return
    setActioning(action)
    try {
      await callAction(BASE, id, action, body)
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

  const canPause = subscription.status === "active"
  const canResume = subscription.status === "paused"
  const canCancel = subscription.status === "active" || subscription.status === "paused"
  const canSkip = subscription.status === "active" && !subscription.skip_next

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* ── Header ── */}
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
              Subscription <span className="font-mono text-ui-fg-muted">{subscription.id.slice(0, 12)}…</span>
            </Heading>
            <StatusBadge status={subscription.status} />
            {subscription.group_id && (
              <Badge color="blue">Group</Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
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
                onClick={() => handleAction("skip", { skip: true })}
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
      </Container>

      {/* ── Main 2-col grid ── */}
      <div className="grid gap-4 px-0 md:grid-cols-2">
        {/* Customer block */}
        <Container className="p-0">
          <div className="flex items-center gap-2 border-b border-ui-border-base px-6 py-3">
            <User className="text-ui-fg-muted" />
            <Heading level="h2" className="text-sm font-semibold">Customer</Heading>
          </div>
          <div className="px-6 py-4 space-y-3 text-sm">
            {subscription.customer_name ? (
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-muted">Name</Text>
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
                <Text size="small" weight="plus" className="text-ui-fg-muted">Email</Text>
                <div>{subscription.customer_email}</div>
              </div>
            ) : null}
            <div>
              <Text size="small" weight="plus" className="text-ui-fg-muted">Customer ID</Text>
              <div className="font-mono text-xs text-ui-fg-muted">{subscription.customer_id}</div>
            </div>
          </div>
        </Container>

        {/* Product block */}
        <Container className="p-0">
          <div className="flex items-center gap-2 border-b border-ui-border-base px-6 py-3">
            <ShoppingBag className="text-ui-fg-muted" />
            <Heading level="h2" className="text-sm font-semibold">Product</Heading>
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
                {subscription.product_title && (
                  <div className="font-medium">{subscription.product_title}</div>
                )}
                {subscription.variant_title && (
                  <div className="text-ui-fg-muted">{subscription.variant_title}</div>
                )}
                <div className="font-mono text-xs text-ui-fg-subtle">{subscription.variant_id}</div>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-muted">Quantity</Text>
                <div>{subscription.quantity}</div>
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-muted">Cycle</Text>
                <div>Every {subscription.cycle_weeks} weeks</div>
              </div>
              <div>
                <Text size="small" weight="plus" className="text-ui-fg-muted">Discount</Text>
                <div>{subscription.discount_percent}%</div>
              </div>
            </dl>
          </div>
        </Container>

        {/* Renewal block */}
        <Container className="p-0">
          <div className="flex items-center gap-2 border-b border-ui-border-base px-6 py-3">
            <ArrowPath className="text-ui-fg-muted" />
            <Heading level="h2" className="text-sm font-semibold">Renewal</Heading>
          </div>
          <div className="px-6 py-4 space-y-3 text-sm">
            <div>
              <Text size="small" weight="plus" className="text-ui-fg-muted">Next renewal</Text>
              <div>{formatDate(subscription.next_renewal_at)}</div>
            </div>
            <div>
              <Text size="small" weight="plus" className="text-ui-fg-muted">Last renewal</Text>
              <div>{formatDate(subscription.last_renewal_at)}</div>
            </div>
            <div>
              <Text size="small" weight="plus" className="text-ui-fg-muted">Deliveries</Text>
              <div>{subscription.delivery_count}</div>
            </div>
            {subscription.skip_next && (
              <Badge color="orange">Next delivery will be skipped</Badge>
            )}
            {subscription.retry_count > 0 && (
              <div className="rounded-md bg-ui-bg-subtle border border-ui-border-base px-3 py-2 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge color="red">Payment retry</Badge>
                  <span className="text-xs text-ui-fg-muted">Attempt {subscription.retry_count}</span>
                </div>
                <div className="text-xs text-ui-fg-muted">
                  Next retry: {formatDate(subscription.next_retry_at)}
                </div>
              </div>
            )}
          </div>
        </Container>

        {/* Stripe block */}
        <Container className="p-0">
          <div className="flex items-center gap-2 border-b border-ui-border-base px-6 py-3">
            <CurrencyDollar className="text-ui-fg-muted" />
            <Heading level="h2" className="text-sm font-semibold">Stripe</Heading>
          </div>
          <div className="px-6 py-4 space-y-3 text-sm">
            <div>
              <Text size="small" weight="plus" className="text-ui-fg-muted">Customer ID</Text>
              <div className="font-mono text-xs">{subscription.stripe_customer_id || "–"}</div>
            </div>
            <div>
              <Text size="small" weight="plus" className="text-ui-fg-muted">Payment method</Text>
              <div className="font-mono text-xs">{subscription.stripe_payment_method_id || "–"}</div>
            </div>
          </div>
        </Container>
      </div>

      {/* ── Orders history (full width) ── */}
      <Container className="p-0">
        <div className="flex items-center gap-2 border-b border-ui-border-base px-6 py-3">
          <BuildingTax className="text-ui-fg-muted" />
          <Heading level="h2" className="text-sm font-semibold">Orders</Heading>
          <span className="ml-auto text-xs text-ui-fg-muted">{subscription.linked_orders.length} order(s)</span>
        </div>
        <div className="px-6 py-4">
          {subscription.linked_orders.length === 0 ? (
            <p className="text-sm text-ui-fg-muted">No orders linked yet.</p>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Order ID</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Payment</Table.HeaderCell>
                  <Table.HeaderCell>Total</Table.HeaderCell>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {subscription.linked_orders.map((o) => {
                  const isRenewal = !!(o.metadata?.renewal || o.metadata?.subscription_id)
                  return (
                    <Table.Row key={o.id}>
                      <Table.Cell>
                        <a
                          href={`/app/orders/${o.id}`}
                          className="font-mono text-xs text-ui-fg-interactive hover:underline"
                        >
                          {o.id.slice(0, 12)}…
                        </a>
                      </Table.Cell>
                      <Table.Cell className="text-xs">{formatDate(o.created_at)}</Table.Cell>
                      <Table.Cell><OrderStatusBadge status={o.status} /></Table.Cell>
                      <Table.Cell><OrderStatusBadge status={o.payment_status} /></Table.Cell>
                      <Table.Cell className="text-xs">{formatCurrency(o.total)}</Table.Cell>
                      <Table.Cell>
                        {isRenewal ? (
                          <Badge color="blue">Renewal</Badge>
                        ) : (
                          <Badge color="grey">Initial</Badge>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
          )}
        </div>
      </Container>

      {/* ── Addresses (full width) ── */}
      {(subscription.shipping_address || subscription.billing_address) && (
        <Container className="p-0">
          <div className="border-b border-ui-border-base px-6 py-3">
            <Heading level="h2" className="text-sm font-semibold">Addresses</Heading>
          </div>
          <div className="grid gap-6 px-6 py-4 md:grid-cols-2">
            <AddressBlock title="Shipping address" addr={subscription.shipping_address} />
            <AddressBlock title="Billing address" addr={subscription.billing_address} />
          </div>
        </Container>
      )}

      {/* ── Group members ── */}
      {subscription.group_members.length > 0 && (
        <Container className="p-0">
          <div className="border-b border-ui-border-base px-6 py-3">
            <div className="flex items-center gap-2">
              <Heading level="h2" className="text-sm font-semibold">Subscription group</Heading>
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
      )}
    </div>
  )
}

export default SubscriptionDetailPage
