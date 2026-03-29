import { BuildingTax } from "@medusajs/icons"
import { Badge, Container, Heading, Table } from "@medusajs/ui"

import type { SubscriptionDetail } from "./subscription-detail.types"
import { formatCurrency, formatDate, OrderStatusBadge } from "./shared"

export function OrdersTable({ subscription }: { subscription: SubscriptionDetail }) {
  return (
    <Container className="p-0">
      <div className="flex items-center gap-2 border-b border-ui-border-base px-6 py-3">
        <BuildingTax className="text-ui-fg-muted" />
        <Heading level="h2" className="text-sm font-semibold">
          Orders
        </Heading>
        <span className="ml-auto text-xs text-ui-fg-muted">
          {subscription.linked_orders.length} order(s)
        </span>
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
                    <Table.Cell>
                      <OrderStatusBadge status={o.status} />
                    </Table.Cell>
                    <Table.Cell>
                      <OrderStatusBadge status={o.payment_status} />
                    </Table.Cell>
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
  )
}
