// @ts-nocheck — Admin build uses Vite (ESM); root tsconfig is NodeNext. React types from deps (React 19) conflict with project React 18.
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

type Product = { code: string; name?: string; carrier_code?: string }
type EnabledRow = { id: string; product_code: string; carrier_name: string; enabled: boolean }
type OptionRow = {
  id: string
  name?: string
  type?: { code?: string }
  data?: { price_bands?: { max_grams: number; amount_minor: number }[]; flat_amount_minor?: number }
}

const ShipmondoSettingsPage = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [enabled, setEnabled] = useState<EnabledRow[]>([])
  const [options, setOptions] = useState<OptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [prodRes, enRes, optRes] = await Promise.all([
        fetch(`${BASE}/admin/shipmondo/products`, { credentials: "include" }),
        fetch(`${BASE}/admin/shipmondo/enabled`, { credentials: "include" }),
        fetch(`${BASE}/admin/shipmondo/options`, { credentials: "include" }),
      ])
      if (prodRes.ok) {
        const j = await prodRes.json()
        setProducts(j.products ?? [])
      }
      if (enRes.ok) {
        const j = await enRes.json()
        setEnabled(j.enabled ?? [])
      }
      if (optRes.ok) {
        const j = await optRes.json()
        setOptions(j.options ?? [])
      }
    } catch {
      toast.error("Failed to load Shipmondo data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const enabledByCode = new Map(enabled.map((e) => [e.product_code, e]))

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await fetch(`${BASE}/admin/shipmondo/sync`, {
        method: "POST",
        credentials: "include",
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(j.message || "Sync done")
        await load()
      } else {
        toast.error(j?.message || "Sync failed")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed")
    } finally {
      setSyncing(false)
    }
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
          toast.success("Prices saved")
          await load()
        } else {
          const j = await res.json().catch(() => ({}))
          toast.error(j?.message || "Save failed")
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed")
      } finally {
        setSaving(null)
      }
    },
    [load]
  )

  if (loading) {
    return (
      <Container>
        <Text className="p-6">Loading…</Text>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-2 px-6 py-4">
        <Heading level="h1">Shipmondo</Heading>
        <Text className="text-ui-fg-subtle">
          Standard: GLS, DAO og PostNord oprettes ved <strong>seed</strong> (du behøver ikke Sync). Sæt priser per option under &quot;Shipping option prices&quot;. Ved dynamisk liste (env <code>SHIPMONDO_CHECKOUT_CARRIER_CODES=__API__</code>) bruges &quot;Carriers&quot; og Sync.
        </Text>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        <Heading level="h2">Carriers</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Kun ved dynamisk liste (__API__): enable/disable produkter fra Shipmondo API. Ved standard (fast model) ignoreres dette – checkout viser GLS, DAO, PostNord fra seed.
        </Text>
        {products.length === 0 ? (
          <Text className="text-ui-fg-subtle">No products from Shipmondo (check API credentials, or use standard seed-based setup).</Text>
        ) : (
          <ul className="flex flex-col gap-2">
            {products.map((p) => {
              const row = enabledByCode.get(p.code)
              const isOn = row ? row.enabled : false
              return (
                <li
                  key={p.code}
                  className="flex items-center justify-between rounded-lg border border-ui-border-base p-3"
                >
                  <div>
                    <Text weight="plus">{p.name ?? p.code}</Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      {p.code}
                    </Text>
                  </div>
                  <Switch
                    checked={isOn}
                    onCheckedChange={(checked) => {
                      const list = Array.from(enabledByCode.values())
                      const nextList = list.some((e) => e.product_code === p.code)
                        ? list.map((e) => (e.product_code === p.code ? { ...e, enabled: checked } : e))
                        : [...list, { id: "", product_code: p.code, carrier_name: p.name ?? p.code, enabled: checked }]
                      setEnabled(nextList as EnabledRow[])
                      fetch(`${BASE}/admin/shipmondo/enabled`, {
                        method: "PUT",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          product_codes: nextList.map((e) => ({ product_code: e.product_code, carrier_name: e.carrier_name, enabled: e.enabled })),
                        }),
                      })
                        .then(async (r) => {
                        if (r.ok) await load()
                        else return r.json()
                      })
                        .then((j) => { if (j && typeof j === "object") toast.error((j as { message?: string }).message || "Failed to update") })
                    }}
                  />
                </li>
              )
            })}
          </ul>
        )}
        <Button type="button" variant="secondary" disabled={syncing} onClick={sync}>
          {syncing ? "Syncing…" : "Sync from Shipmondo"}
        </Button>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        <Heading level="h2">Shipping option prices</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Per carrier: flat price (øre) and/or vægtbands (op til X gram → pris). Priser i øre (3900 = 39,00 DKK). Beregning bruger kurvvægt; vægtbands tæller først hvis begge er sat.
        </Text>
        {options.length === 0 ? (
          <Text className="text-ui-fg-subtle">
            Ingen Shipmondo-options endnu. Kør <strong>pnpm seed</strong> i apps/commerce (fra repo-roden: <code>cd apps/commerce && pnpm seed</code>). Sørg for at Locations → Denmark har Shipping aktiveret og et fulfillment set; seed opretter derefter tre options (GLS, DAO, PostNord). Hvis du bruger dynamisk model, aktivér carriers ovenfor og kør Sync.
          </Text>
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
    </Container>
  )
}

type PriceBand = { max_grams: number; amount_minor: number }

function OptionPriceForm({
  option,
  saving,
  onSave,
}: {
  option: OptionRow
  saving: boolean
  onSave: (data: { flat_amount_minor?: number; price_bands?: PriceBand[] }) => void
}) {
  const flat = option.data?.flat_amount_minor ?? ""
  const bandsFromOption = option.data?.price_bands ?? []
  const [flatInput, setFlatInput] = useState(flat === "" ? "" : String(flat))
  const [bands, setBands] = useState<PriceBand[]>(bandsFromOption.length > 0 ? [...bandsFromOption] : [])

  useEffect(() => {
    setFlatInput(flat === "" ? "" : String(flat))
  }, [flat])
  useEffect(() => {
    setBands(bandsFromOption.length > 0 ? [...bandsFromOption] : [])
  }, [option.id, JSON.stringify(bandsFromOption)])

  const addBand = () => setBands((b) => [...b, { max_grams: 2000, amount_minor: 3900 }])
  const removeBand = (i: number) => setBands((b) => b.filter((_, j) => j !== i))
  const updateBand = (i: number, field: "max_grams" | "amount_minor", value: number) =>
    setBands((b) => b.map((row, j) => (j !== i ? row : { ...row, [field]: value })))

  const handleSave = () => {
    const flatNum = flatInput === "" ? undefined : Math.round(Number(flatInput))
    if (flatNum !== undefined && (Number.isNaN(flatNum) || flatNum < 0)) return
    const sortedBands = bands
      .filter((r) => Number.isFinite(r.max_grams) && Number.isFinite(r.amount_minor) && r.max_grams >= 0 && r.amount_minor >= 0)
      .sort((a, b) => a.max_grams - b.max_grams)
    onSave({
      flat_amount_minor: flatNum,
      price_bands: sortedBands.length > 0 ? sortedBands : undefined,
    })
  }

  return (
    <li className="rounded-lg border border-ui-border-base p-4">
      <Text weight="plus" className="mb-3 block">
        {option.name ?? option.type?.code ?? option.id}
      </Text>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label>Flat pris (øre)</Label>
          <Input
            type="number"
            min={0}
            value={flatInput}
            onChange={(e) => setFlatInput(e.target.value)}
            placeholder="f.eks. 3900"
          />
        </div>
      </div>

      <div className="mb-3">
        <Label className="mb-2 block">Vægtbands (op til X gram → pris i øre)</Label>
        <Text size="small" className="text-ui-fg-subtle mb-2 block">
          Fx 0–2 kg: max_grams 2000, pris 3900. Næste band fx 2–5 kg: max_grams 5000, pris 4900.
        </Text>
        <ul className="flex flex-col gap-2">
          {bands.map((row, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Gram"
                value={row.max_grams}
                onChange={(e) => updateBand(i, "max_grams", Math.round(Number(e.target.value) || 0))}
                className="w-28"
              />
              <span className="text-ui-fg-subtle">gram →</span>
              <Input
                type="number"
                min={0}
                placeholder="Øre"
                value={row.amount_minor}
                onChange={(e) => updateBand(i, "amount_minor", Math.round(Number(e.target.value) || 0))}
                className="w-28"
              />
              <span className="text-ui-fg-subtle">øre</span>
              <Button type="button" variant="transparent" size="small" onClick={() => removeBand(i)}>
                Fjern
              </Button>
            </li>
          ))}
        </ul>
        <Button type="button" variant="secondary" size="small" className="mt-2" onClick={addBand}>
          Tilføj band
        </Button>
      </div>

      <Button type="button" size="small" disabled={saving} onClick={handleSave}>
        {saving ? "Gemmer…" : "Gem priser"}
      </Button>
    </li>
  )
}

export const config = defineRouteConfig({
  label: "Shipmondo",
})

export default ShipmondoSettingsPage
