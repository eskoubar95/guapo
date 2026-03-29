import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowPath } from "@medusajs/icons"
import {
  Badge,
  Button,
  Checkbox,
  Container,
  Heading,
  Select,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

type Subscription = {
  id: string
  customer_id: string
  customer_email: string
  customer_name: string
  product_title: string
  status: string
  cycle_weeks: number
  next_renewal_at: string
  delivery_count: number
  discount_percent: number
  group_id?: string | null
}

type SubscriptionsResponse = {
  subscriptions: Subscription[]
  count: number
  limit: number
  offset: number
}

const STATUS_OPTIONS = [
  { value: "__all__", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "on_hold", label: "On hold" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "green" | "orange" | "red" | "grey"> = {
    active: "green",
    paused: "orange",
    on_hold: "red",
    cancelled: "grey",
    expired: "grey",
  }
  return <Badge color={map[status] ?? "grey"}>{status}</Badge>
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("da-DK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [merging, setMerging] = useState(false)

  const loadSubscriptions = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    try {
      const params = new URLSearchParams()
      params.set("limit", String(LIMIT))
      params.set("offset", String(page * LIMIT))
      params.set("enrich", "true")
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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const subs = data?.subscriptions ?? []
    if (selected.size === subs.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(subs.map((s) => s.id)))
    }
  }

  const handleMerge = async () => {
    if (selected.size < 2) {
      toast.error("Select at least 2 subscriptions to merge")
      return
    }
    setMerging(true)
    try {
      const res = await fetch(`${BASE}/admin/subscriptions/merge`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_ids: [...selected],
          align_dates: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error((json as { message?: string })?.message ?? "Merge failed")
      }
      toast.success(`Merged ${selected.size} subscriptions into group ${String(json.group_id).slice(0, 8)}…`)
      loadSubscriptions()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Merge failed")
    } finally {
      setMerging(false)
    }
  }

  const subs = data?.subscriptions ?? []
  const total = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const allSelected = subs.length > 0 && selected.size === subs.length

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex flex-col gap-2 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading level="h1">Subscriptions</Heading>
          <div className="flex items-center gap-2 flex-wrap">
            {selected.size >= 2 && (
              <Button
                size="small"
                variant="secondary"
                onClick={handleMerge}
                disabled={merging}
              >
                Merge {selected.size} subscriptions
              </Button>
            )}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v ?? "__all__")
                setPage(0)
              }}
            >
              <Select.Trigger className="w-[160px]">
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
        {selected.size > 0 && (
          <Text size="small" className="text-ui-fg-muted">
            {selected.size} selected – select {selected.size >= 2 ? "" : "one more "}to enable merge
          </Text>
        )}
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        {loading && subs.length === 0 ? (
          <p className="py-8 text-center text-sm text-ui-fg-muted">Loading…</p>
        ) : subs.length === 0 ? (
          <p className="py-8 text-center text-sm text-ui-fg-muted">No subscriptions found.</p>
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell className="w-8">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                    />
                  </Table.HeaderCell>
                  <Table.HeaderCell>ID</Table.HeaderCell>
                  <Table.HeaderCell>Customer</Table.HeaderCell>
                  <Table.HeaderCell>Product</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Cycle</Table.HeaderCell>
                  <Table.HeaderCell>Next renewal</Table.HeaderCell>
                  <Table.HeaderCell>Deliveries</Table.HeaderCell>
                  <Table.HeaderCell>Discount</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {subs.map((s) => (
                  <Table.Row
                    key={s.id}
                    className={selected.has(s.id) ? "bg-ui-bg-highlight" : ""}
                  >
                    <Table.Cell>
                      <Checkbox
                        checked={selected.has(s.id)}
                        onCheckedChange={() => toggleSelect(s.id)}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/subscriptions/${s.id}`}
                          className="font-mono text-xs text-ui-fg-interactive hover:underline"
                        >
                          {s.id.slice(0, 10)}…
                        </Link>
                        {s.group_id && (
                          <Badge color="blue" className="text-[10px] px-1 py-0">G</Badge>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-sm">
                        {s.customer_name || s.customer_email ? (
                          <>
                            {s.customer_name && <div className="font-medium">{s.customer_name}</div>}
                            {s.customer_email && (
                              <div className="text-xs text-ui-fg-muted">{s.customer_email}</div>
                            )}
                          </>
                        ) : (
                          <span className="font-mono text-xs text-ui-fg-muted">{s.customer_id.slice(0, 10)}…</span>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-sm max-w-[160px] truncate" title={s.product_title}>
                        {s.product_title || <span className="font-mono text-xs text-ui-fg-muted">–</span>}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <StatusBadge status={s.status} />
                    </Table.Cell>
                    <Table.Cell>{s.cycle_weeks}w</Table.Cell>
                    <Table.Cell className="text-xs">{formatDate(s.next_renewal_at)}</Table.Cell>
                    <Table.Cell>{s.delivery_count}</Table.Cell>
                    <Table.Cell>{s.discount_percent}%</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 text-sm text-ui-fg-muted">
              <span>
                {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}
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
