// @ts-nocheck — Admin build uses Vite (ESM); root tsconfig is NodeNext. React types from deps (React 19) conflict with project React 18.
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Tabs, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useMemo, useState } from "react"
import { OptionPriceForm } from "./_components/OptionPriceForm"
import { ShipmondoCatalogWizard } from "./_components/ShipmondoCatalogWizard"
import { ShipmondoOptionsGrid } from "./_components/ShipmondoOptionsGrid"
import type { OptionRow } from "./_components/shipmondo-admin.types"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

type EnabledProductRow = { product_code: string; carrier_name: string; enabled: boolean }

const ShipmondoSettingsPage = () => {
  const [options, setOptions] = useState<OptionRow[]>([])
  const [enabledRows, setEnabledRows] = useState<EnabledProductRow[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const refreshOptions = useCallback(async () => {
    try {
      const optRes = await fetch(`${BASE}/admin/shipmondo/options`, { credentials: "include" })
      if (!optRes.ok) {
        const j = await optRes.json().catch(() => ({}))
        throw new Error(j?.message || `Kunne ikke hente leveringsmuligheder (${optRes.status})`)
      }
      const j = await optRes.json()
      setOptions(j.options ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke opdatere leveringsmuligheder")
      throw e
    }
  }, [])

  const refreshEnabled = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/admin/shipmondo/enabled`, { credentials: "include" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.message || `Kunne ikke hente aktiveret-liste (${res.status})`)
      }
      const j = await res.json()
      const list = j.enabled ?? []
      setEnabledRows(Array.isArray(list) ? list : [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke opdatere aktiveret-liste")
      throw e
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await refreshOptions()
    await refreshEnabled()
  }, [refreshOptions, refreshEnabled])

  const enabledByProductCode = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const r of enabledRows) {
      if (r.product_code) m.set(r.product_code, r.enabled !== false)
    }
    return m
  }, [enabledRows])

  const handleToggleEnabled = useCallback(
    async (productCode: string, enabled: boolean, carrierLabel: string) => {
      const res = await fetch(`${BASE}/admin/shipmondo/enabled`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_code: productCode,
          carrier_name: carrierLabel,
          enabled,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.message || "Kunne ikke opdatere")
      }
      await refreshEnabled()
    },
    [refreshEnabled]
  )

  const load = useCallback(async () => {
    setInitialLoading(true)
    try {
      await Promise.all([refreshOptions(), refreshEnabled()])
    } catch {
      toast.error("Kunne ikke indlæse Shipmondo")
    } finally {
      setInitialLoading(false)
    }
  }, [refreshOptions, refreshEnabled])

  useEffect(() => {
    void load()
  }, [load])

  const saveOptionPrice = useCallback(
    async (optionId: string, data: { flat_amount_minor?: number; price_bands?: { max_grams: number; amount_minor: number }[] }) => {
      setSaving(optionId)
      try {
        const res = await fetch(`${BASE}/admin/shipmondo/options/${optionId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        })
        if (res.ok) {
          toast.success("Priser gemt")
          await refreshOptions()
        } else {
          const j = await res.json().catch(() => ({}))
          toast.error(j?.message || "Kunne ikke gemme")
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Kunne ikke gemme")
      } finally {
        setSaving(null)
      }
    },
    [refreshOptions]
  )

  if (initialLoading) {
    return (
      <Container>
        <Text className="p-6">Indlæser…</Text>
      </Container>
    )
  }

  return (
    <Container className="flex flex-col p-0">
      <div className="flex flex-col gap-1 border-b border-ui-border-base px-6 py-4">
        <Heading level="h1">Shipmondo</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Vælg produkter fra Shipmondo og sæt priser her. Zoner og fulfillment: Settings → Locations &amp; Shipping.
        </Text>
      </div>

      <Tabs defaultValue="delivery" className="flex flex-col">
        <Tabs.List className="border-b border-ui-border-base px-6">
          <Tabs.Trigger value="delivery">Levering</Tabs.Trigger>
          <Tabs.Trigger value="pricing">Priser</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="delivery" className="outline-none">
          <div className="flex flex-col gap-6 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Heading level="h2">Dine leveringsmuligheder</Heading>
              <ShipmondoCatalogWizard onApplied={refreshAll} />
            </div>
            <ShipmondoOptionsGrid
              options={options}
              enabledByProductCode={enabledByProductCode}
              onToggleEnabled={handleToggleEnabled}
              onRefresh={refreshAll}
            />
            <div className="rounded-lg border border-ui-border-base border-dashed p-4">
              <Text size="small" className="text-ui-fg-subtle">
                Listen viser aktive Shipmondo-metoder i checkout. Brug <strong>Tilføj fra Shipmondo</strong> for at hente
                produkter fra din konto og opdatere uden at genindlæse siden.
              </Text>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="pricing" className="outline-none">
          <div className="flex flex-col gap-4 px-6 py-6">
            <Text size="small" className="text-ui-fg-subtle">
              Flat pris og vægtbands (ex. moms). Produktvalg styres under <strong>Levering</strong>.
            </Text>
            {options.length === 0 ? (
              <Text className="text-ui-fg-subtle">Ingen muligheder endnu — tilføj under fanen Levering.</Text>
            ) : (
              <ul className="flex flex-col gap-4">
                {options.map((opt) => (
                  <OptionPriceForm
                    key={opt.id}
                    option={opt}
                    saving={saving === opt.id}
                    onSave={(data) => saveOptionPrice(opt.id, data)}
                  />
                ))}
              </ul>
            )}
          </div>
        </Tabs.Content>
      </Tabs>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Shipmondo",
})

export default ShipmondoSettingsPage
