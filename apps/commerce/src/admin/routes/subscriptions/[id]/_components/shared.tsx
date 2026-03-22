import { Badge, Text } from "@medusajs/ui"

const STATUS_COLORS: Record<string, "green" | "orange" | "red" | "grey"> = {
  active: "green",
  paused: "orange",
  on_hold: "red",
  cancelled: "grey",
  expired: "grey",
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge color={STATUS_COLORS[status] ?? "grey"}>{status}</Badge>
}

export function OrderStatusBadge({ status }: { status?: string }) {
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

export function formatDate(s: string | null | undefined) {
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

export function formatCurrency(amount?: number) {
  if (amount == null) return "–"
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

export function AddressBlock({
  title,
  addr,
}: {
  title: string
  addr: Record<string, unknown> | null
}) {
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
