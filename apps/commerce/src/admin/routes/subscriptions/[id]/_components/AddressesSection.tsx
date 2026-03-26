import { PencilSquare } from "@medusajs/icons"
import {
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
} from "@medusajs/ui"
import { useState } from "react"

import type { SubscriptionDetail } from "./subscription-detail.types"
import { AddressBlock } from "./shared"

type Props = {
  subscription: SubscriptionDetail
  onSave: (body: {
    shipping_address?: Record<string, unknown>
    billing_address?: Record<string, unknown>
  }) => Promise<void>
  saving?: boolean
}

type EditableAddress = {
  first_name?: string
  last_name?: string
  address_1?: string
  address_2?: string
  city?: string
  postal_code?: string
  country_code?: string
  phone?: string
  email?: string
}

function normalizeAddress(addr: Record<string, unknown> | null | undefined): EditableAddress {
  return {
    first_name: String(addr?.first_name ?? ""),
    last_name: String(addr?.last_name ?? ""),
    address_1: String(addr?.address_1 ?? ""),
    address_2: String(addr?.address_2 ?? ""),
    city: String(addr?.city ?? ""),
    postal_code: String(addr?.postal_code ?? ""),
    country_code: String(addr?.country_code ?? ""),
    phone: String(addr?.phone ?? ""),
    email: String(addr?.email ?? ""),
  }
}

export function AddressesSection({ subscription, onSave, saving }: Props) {
  const [open, setOpen] = useState(false)
  const [shipping, setShipping] = useState<EditableAddress>(
    normalizeAddress(subscription.shipping_address)
  )
  const [billing, setBilling] = useState<EditableAddress>(
    normalizeAddress(subscription.billing_address)
  )

  if (!subscription.shipping_address && !subscription.billing_address) return null

  const submit = async () => {
    await onSave({
      shipping_address: shipping,
      billing_address: billing,
    })
    setOpen(false)
  }

  return (
    <Container className="p-0">
      <div className="border-b border-ui-border-base px-6 py-3 flex items-center justify-between">
        <Heading level="h2" className="text-sm font-semibold">
          Addresses
        </Heading>
        <Drawer open={open} onOpenChange={setOpen}>
          <Drawer.Trigger asChild>
            <Button size="small" variant="secondary">
              <PencilSquare />
              Edit
            </Button>
          </Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Edit subscription addresses</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body className="max-h-[85vh] overflow-y-auto p-4 space-y-6">
              <div className="space-y-2">
                <Heading level="h3" className="text-sm font-semibold">Shipping</Heading>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>First name</Label><Input value={shipping.first_name} onChange={(e) => setShipping((s) => ({ ...s, first_name: e.target.value }))} /></div>
                  <div><Label>Last name</Label><Input value={shipping.last_name} onChange={(e) => setShipping((s) => ({ ...s, last_name: e.target.value }))} /></div>
                  <div className="col-span-2"><Label>Address 1</Label><Input value={shipping.address_1} onChange={(e) => setShipping((s) => ({ ...s, address_1: e.target.value }))} /></div>
                  <div className="col-span-2"><Label>Address 2</Label><Input value={shipping.address_2} onChange={(e) => setShipping((s) => ({ ...s, address_2: e.target.value }))} /></div>
                  <div><Label>City</Label><Input value={shipping.city} onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))} /></div>
                  <div><Label>Postal code</Label><Input value={shipping.postal_code} onChange={(e) => setShipping((s) => ({ ...s, postal_code: e.target.value }))} /></div>
                  <div><Label>Country code</Label><Input value={shipping.country_code} onChange={(e) => setShipping((s) => ({ ...s, country_code: e.target.value.toUpperCase() }))} /></div>
                  <div><Label>Phone</Label><Input value={shipping.phone} onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))} /></div>
                  <div className="col-span-2"><Label>Email</Label><Input value={shipping.email} onChange={(e) => setShipping((s) => ({ ...s, email: e.target.value }))} /></div>
                </div>
              </div>
              <div className="space-y-2">
                <Heading level="h3" className="text-sm font-semibold">Billing</Heading>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>First name</Label><Input value={billing.first_name} onChange={(e) => setBilling((s) => ({ ...s, first_name: e.target.value }))} /></div>
                  <div><Label>Last name</Label><Input value={billing.last_name} onChange={(e) => setBilling((s) => ({ ...s, last_name: e.target.value }))} /></div>
                  <div className="col-span-2"><Label>Address 1</Label><Input value={billing.address_1} onChange={(e) => setBilling((s) => ({ ...s, address_1: e.target.value }))} /></div>
                  <div className="col-span-2"><Label>Address 2</Label><Input value={billing.address_2} onChange={(e) => setBilling((s) => ({ ...s, address_2: e.target.value }))} /></div>
                  <div><Label>City</Label><Input value={billing.city} onChange={(e) => setBilling((s) => ({ ...s, city: e.target.value }))} /></div>
                  <div><Label>Postal code</Label><Input value={billing.postal_code} onChange={(e) => setBilling((s) => ({ ...s, postal_code: e.target.value }))} /></div>
                  <div><Label>Country code</Label><Input value={billing.country_code} onChange={(e) => setBilling((s) => ({ ...s, country_code: e.target.value.toUpperCase() }))} /></div>
                  <div><Label>Phone</Label><Input value={billing.phone} onChange={(e) => setBilling((s) => ({ ...s, phone: e.target.value }))} /></div>
                  <div className="col-span-2"><Label>Email</Label><Input value={billing.email} onChange={(e) => setBilling((s) => ({ ...s, email: e.target.value }))} /></div>
                </div>
              </div>
            </Drawer.Body>
            <Drawer.Footer>
              <div className="flex items-center justify-end gap-2">
                <Drawer.Close asChild>
                  <Button size="small" variant="secondary" disabled={!!saving}>
                    Cancel
                  </Button>
                </Drawer.Close>
                <Button size="small" onClick={submit} isLoading={!!saving}>
                  Save
                </Button>
              </div>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>
      </div>
      <div className="grid gap-6 px-6 py-4 md:grid-cols-2">
        <AddressBlock title="Shipping address" addr={subscription.shipping_address} />
        <AddressBlock title="Billing address" addr={subscription.billing_address} />
      </div>
    </Container>
  )
}
