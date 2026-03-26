import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps } from "@medusajs/framework/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

type OrderLike = {
  id?: string
  shipping_methods?: Array<{ data?: Record<string, unknown> | null }>
}

function pickupFromMethodData(data: Record<string, unknown> | null | undefined): {
  id: string
  lines: string[]
  carrier?: string
} | null {
  if (!data || typeof data !== "object") return null
  const sid = data.service_point_id
  if (sid == null || sid === "") return null
  const name = typeof data.service_point_name === "string" ? data.service_point_name : ""
  const addr = typeof data.service_point_address === "string" ? data.service_point_address : ""
  const zip = typeof data.service_point_zipcode === "string" ? data.service_point_zipcode : ""
  const city = typeof data.service_point_city === "string" ? data.service_point_city : ""
  const carrier = typeof data.carrier_code === "string" ? data.carrier_code : undefined
  const lines = [name, addr, [zip, city].filter(Boolean).join(" ")].filter((l) => l && String(l).trim() !== "")
  if (lines.length === 0 && !carrier) return null
  return { id: String(sid), lines, carrier }
}

const OrderDeliveryInfoWidget = ({ data }: DetailWidgetProps) => {
  const order = data as OrderLike
  const [resolved, setResolved] = useState<OrderLike | null>(null)
  const effective = resolved ?? order

  useEffect(() => {
    if (effective?.shipping_methods?.length || !order?.id) return
    let cancelled = false
    fetch(`${BASE}/admin/orders/${encodeURIComponent(order.id)}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { order?: OrderLike } | null) => {
        if (cancelled || !json?.order) return
        setResolved(json.order)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [order?.id, effective?.shipping_methods?.length])

  const sm = effective?.shipping_methods?.[0]?.data
  const pickup = pickupFromMethodData(sm ?? undefined)

  if (!pickup) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2" className="mb-2 text-sm font-semibold">
          Parcel shop / pickup
        </Heading>
        <p className="mb-2 text-xs text-ui-fg-muted">
          Shipping address on the order is the customer&apos;s home; labels use this pickup point.
        </p>
        {pickup.carrier && (
          <Badge size="small" className="mb-2">
            {pickup.carrier.toUpperCase()}
          </Badge>
        )}
        <Text size="small" className="text-ui-fg-subtle">
          ID: {pickup.id}
        </Text>
        <ul className="mt-2 space-y-1 text-sm text-ui-fg-base">
          {pickup.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderDeliveryInfoWidget
