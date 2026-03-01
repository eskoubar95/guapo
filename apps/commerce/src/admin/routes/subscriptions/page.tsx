import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowPath } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Table,
  Select,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

type Subscription = {
  id: string
  customer_id: string
  status: string
  cycle_weeks: number
  next_renewal_at: string
  delivery_count: number
  discount_percent: number
  variant_id: string
  quantity: number
}

type SubscriptionsResponse = {
  subscriptions: Subscription[]
  count: number
  limit: number
  offset: number
}

const STATUS_OPTIONS = [
  { value: "__all__", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "on_hold", label: "On hold" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
]

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

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString()
  } catch {
    return s
  }
}

const LIMIT = 15

const SubscriptionsPage = () => {
  const [page, setPage] = useState(0)
  const [data, setData] = useState<SubscriptionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("__all__")

  const loadSubscriptions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", String(LIMIT))
      params.set("offset", String(page * LIMIT))
      if (statusFilter !== "__all__") params.set("status", statusFilter)
      const res = await fetch(`${BASE}/admin/subscriptions?${params}`, {
        credentials: "include",
      })
      if (res.ok) {
        setData(await res.json())
      } else {
        setData(null)
      }
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  const subs = data?.subscriptions ?? []
  const total = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-2 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading level="h1">Subscriptions</Heading>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v ?? "__all__")
                setPage(0)
              }}
            >
              <Select.Trigger className="w-[140px]">
                <Select.Value placeholder="Status" />
              </Select.Trigger>
              <Select.Content>
                {STATUS_OPTIONS.map((o) => (
                  <Select.Item key={o.value} value={o.value}>
                    {o.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
            <Button variant="secondary" size="small" onClick={loadSubscriptions}>
              <ArrowPath />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {loading && subs.length === 0 ? (
          <p className="py-8 text-center text-sm text-ui-fg-muted">Loading…</p>
        ) : subs.length === 0 ? (
          <p className="py-8 text-center text-sm text-ui-fg-muted">
            No subscriptions found.
          </p>
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>ID</Table.HeaderCell>
                  <Table.HeaderCell>Customer</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Cycle</Table.HeaderCell>
                  <Table.HeaderCell>Next renewal</Table.HeaderCell>
                  <Table.HeaderCell>Deliveries</Table.HeaderCell>
                  <Table.HeaderCell>Discount</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {subs.map((s) => (
                  <Table.Row key={s.id}>
                    <Table.Cell>
                      <Link
                        to={`/subscriptions/${s.id}`}
                        className="text-ui-fg-interactive hover:underline"
                      >
                        {s.id.slice(0, 8)}…
                      </Link>
                    </Table.Cell>
                    <Table.Cell>{s.customer_id.slice(0, 8)}…</Table.Cell>
                    <Table.Cell>{statusBadge(s.status)}</Table.Cell>
                    <Table.Cell>Every {s.cycle_weeks}w</Table.Cell>
                    <Table.Cell>{formatDate(s.next_renewal_at)}</Table.Cell>
                    <Table.Cell>{s.delivery_count}</Table.Cell>
                    <Table.Cell>{s.discount_percent}%</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            <div className="flex items-center justify-between pt-4 text-sm text-ui-fg-muted">
              <span>
                {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of{" "}
                {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="small"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Subscriptions",
  icon: ArrowPath,
})

export default SubscriptionsPage
