import { Container, Heading, Text } from "@medusajs/ui"

import type { SubscriptionDetail } from "./subscription-detail.types"

type Props = {
  subscription: SubscriptionDetail
}

export function DeliverySection({ subscription }: Props) {
  const d = subscription.delivery_data as Record<string, unknown> | null | undefined
  const hasPickup =
    d &&
    typeof d === "object" &&
    (d.service_point_id != null || typeof d.service_point_address === "string")

  return (
    <Container className="p-0">
      <div className="border-b border-ui-border-base px-6 py-3">
        <Heading level="h2" className="text-sm font-semibold">
          Delivery preference
        </Heading>
      </div>
      <div className="space-y-3 px-6 py-4">
        <Text size="small" className="text-ui-fg-muted">
          Shipping uses your Shipmondo shipping option on this subscription (carrier + pakkeshop
          details stored as delivery data). Renewals keep that pickup point; only name, phone and
          email are refreshed from the customer profile on the order.
        </Text>
        {hasPickup ? (
          <div className="rounded-lg border border-ui-border-base p-3 text-sm">
            <p className="font-medium text-ui-fg-base">Parcel shop</p>
            {typeof d.service_point_name === "string" && d.service_point_name && (
              <p className="text-ui-fg-subtle">{d.service_point_name}</p>
            )}
            {typeof d.service_point_address === "string" && d.service_point_address && (
              <p className="text-ui-fg-subtle">{d.service_point_address}</p>
            )}
            <p className="text-ui-fg-subtle">
              {[d.service_point_zipcode, d.service_point_city].filter(Boolean).join(" ")}
            </p>
            {typeof d.carrier_code === "string" && d.carrier_code && (
              <p className="mt-1 text-xs text-ui-fg-muted">Carrier: {d.carrier_code}</p>
            )}
            {d.service_point_id != null && (
              <p className="mt-1 text-xs text-ui-fg-muted">Point ID: {String(d.service_point_id)}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-ui-fg-subtle">Home delivery (no parcel shop stored).</p>
        )}
      </div>
    </Container>
  )
}
