// @ts-nocheck — Admin build uses Vite (ESM); root tsconfig is NodeNext. React types from deps may conflict.
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

type FreeShippingSettings = {
  threshold_amount: number
  promotion_code: string
  enabled: boolean
}

const isFreeShippingSettings = (value: unknown): value is FreeShippingSettings => {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    typeof record.threshold_amount === "number" &&
    Number.isFinite(record.threshold_amount) &&
    typeof record.promotion_code === "string" &&
    typeof record.enabled === "boolean"
  )
}

const FreeShippingSettingsPage = () => {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [threshold, setThreshold] = useState("")
  const [promotionCode, setPromotionCode] = useState("")
  const [enabled, setEnabled] = useState(true)

  const applyDto = useCallback((dto: FreeShippingSettings) => {
    setThreshold(String(dto.threshold_amount))
    setPromotionCode(dto.promotion_code)
    setEnabled(dto.enabled)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`${BASE}/admin/guapo-free-shipping/settings`, {
        credentials: "include",
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        const message = j?.message || `Could not load settings (${res.status})`
        setLoadError(message)
        toast.error(message)
        return
      }
      const dto = await res.json()
      if (!isFreeShippingSettings(dto)) {
        throw new Error("Invalid free shipping settings response")
      }
      applyDto(dto)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load free shipping settings"
      setLoadError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [applyDto])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    if (loadError) {
      toast.error("Cannot save while settings failed to load.")
      return
    }
    const thresholdNum = Number.parseFloat(threshold.replace(",", "."))
    if (!Number.isFinite(thresholdNum) || thresholdNum <= 0) {
      toast.error("Threshold must be a positive number (DKK).")
      return
    }
    const code = promotionCode.trim()
    if (!code) {
      toast.error("Promotion code is required.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`${BASE}/admin/guapo-free-shipping/settings`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threshold_amount: thresholdNum,
          promotion_code: code,
          enabled,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Not logged in. Log in to the admin and try again.")
        } else {
          toast.error(j?.message || "Save failed")
        }
        return
      }
      if (!isFreeShippingSettings(j)) {
        throw new Error("Invalid save response payload")
      }
      applyDto(j)
      toast.success("Free shipping settings saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <Text className="p-6">Loading…</Text>
      </Container>
    )
  }

  if (loadError) {
    return (
      <Container className="divide-y p-0">
        <div className="flex flex-col gap-2 px-6 py-4">
          <Heading level="h1">Free shipping</Heading>
          <Text className="text-ui-fg-subtle">
            Could not load current settings. Retry before making changes.
          </Text>
        </div>
        <div className="flex flex-col gap-3 px-6 py-4 max-w-md">
          <Text size="small" className="text-ui-fg-subtle">
            {loadError}
          </Text>
          <Button type="button" size="small" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-2 px-6 py-4">
        <Heading level="h1">Free shipping</Heading>
        <Text className="text-ui-fg-subtle">
          Minimum cart total (DKK) for automatic free shipping. Must match an existing Medusa promotion
          with type <strong>free shipping</strong> and code below — the cart subscriber applies or
          removes that promotion when the threshold is crossed.
        </Text>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4 max-w-md">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fs-threshold" className="text-ui-fg-base">
            Threshold (DKK)
          </Label>
          <Input
            id="fs-threshold"
            type="number"
            min={1}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
          <Text size="small" className="text-ui-fg-subtle">
            Subtotal used for the bar and backend logic matches storefront rules (items incl. VAT where
            applicable).
          </Text>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="fs-code" className="text-ui-fg-base">
            Promotion code
          </Label>
          <Input
            id="fs-code"
            type="text"
            autoComplete="off"
            value={promotionCode}
            onChange={(e) => setPromotionCode(e.target.value)}
          />
          <Text size="small" className="text-ui-fg-subtle">
            Same code as the free-shipping promotion in Medusa (e.g. FREESHIPPING).
          </Text>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-ui-border-base px-4 py-3">
          <div>
            <Text size="small" weight="plus" className="text-ui-fg-base">
              Enabled
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              When off, automatic free-shipping promotion sync is disabled.
            </Text>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <Button type="button" size="small" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Free shipping",
})

export default FreeShippingSettingsPage
