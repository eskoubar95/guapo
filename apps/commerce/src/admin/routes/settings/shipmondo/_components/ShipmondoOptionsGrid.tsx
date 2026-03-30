// @ts-nocheck
import { Button, Switch, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { carrierDisplayLabel, carrierKeyFromCode } from "./carrierPresentation"
import { ShipmondoOptionEditDrawer, productCodeFromOption } from "./ShipmondoOptionEditDrawer"
import { parseServiceCodes } from "./shipmondo-service-codes"
import type { OptionRow } from "./shipmondo-admin.types"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

export function ShipmondoOptionsGrid({
  options,
  enabledByProductCode,
  onToggleEnabled,
  onRefresh,
}: {
  options: OptionRow[]
  enabledByProductCode: Map<string, boolean>
  onToggleEnabled: (productCode: string, enabled: boolean, carrierLabel: string) => Promise<void>
  onRefresh: () => Promise<void>
}) {
  const [editOption, setEditOption] = useState<OptionRow | null>(null)
  const [togglingCode, setTogglingCode] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (options.length === 0) {
    return (
      <Text className="text-ui-fg-subtle">
        Ingen leveringsmuligheder endnu. Tilføj fra Shipmondo under <strong>Levering</strong>.
      </Text>
    )
  }

  const handleSwitch = async (opt: OptionRow, next: boolean) => {
    const code = productCodeFromOption(opt)
    if (!code) {
      toast.error("Kan ikke skifte: mangler product_code")
      return
    }
    const carrierKey = carrierKeyFromCode(typeof opt.data?.carrier_code === "string" ? opt.data.carrier_code : undefined)
    const carrierLabel =
      typeof opt.data?.carrier_code === "string" && opt.data.carrier_code
        ? carrierDisplayLabel(opt.data.carrier_code)
        : carrierDisplayLabel(carrierKey)
    setTogglingCode(code)
    try {
      await onToggleEnabled(code, next, opt.name ?? carrierLabel ?? code)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke opdatere")
    } finally {
      setTogglingCode(null)
    }
  }

  const handleDelete = async (opt: OptionRow) => {
    const title = opt.name ?? opt.type?.code ?? "leveringsmulighed"
    if (!window.confirm(`Slet "${title}"? Metoden fjernes fra checkout og zonen.`)) return
    setDeletingId(opt.id)
    try {
      const res = await fetch(`${BASE}/admin/shipmondo/options/${opt.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(typeof j.message === "string" ? j.message : "Kunne ikke slette")
      }
      toast.success("Leveringsmulighed slettet")
      if (editOption?.id === opt.id) setEditOption(null)
      await onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke slette")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((opt) => {
          const carrierKey = carrierKeyFromCode(typeof opt.data?.carrier_code === "string" ? opt.data.carrier_code : undefined)
          const title = opt.name ?? opt.type?.code ?? "Levering"
          const carrierLabel =
            typeof opt.data?.carrier_code === "string" && opt.data.carrier_code
              ? carrierDisplayLabel(opt.data.carrier_code)
              : carrierDisplayLabel(carrierKey)
          const codes = typeof opt.data?.service_codes === "string" ? opt.data.service_codes : ""
          const { email, sms } = parseServiceCodes(codes)
          const pCode = productCodeFromOption(opt)
          const checkoutOn = pCode ? (enabledByProductCode.get(pCode) ?? true) : true

          return (
            <li
              key={opt.id}
              className="flex flex-col gap-3 rounded-lg border border-ui-border-base bg-ui-bg-subtle-hover/10 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Text weight="plus" className="leading-snug">
                    {title}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    {carrierLabel}
                  </Text>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  <Button type="button" variant="secondary" size="small" onClick={() => setEditOption(opt)}>
                    Ret
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="small"
                    disabled={deletingId === opt.id}
                    onClick={() => void handleDelete(opt)}
                  >
                    Slet
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ui-border-base pt-2">
                <Text size="small" className="text-ui-fg-muted">
                  I checkout
                </Text>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={checkoutOn}
                    disabled={!pCode || togglingCode === pCode}
                    onCheckedChange={(v) => void handleSwitch(opt, v)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-ui-fg-muted">
                <span className={email ? "text-ui-fg-subtle" : "text-ui-fg-muted line-through"}>E-mail</span>
                <span className={sms ? "text-ui-fg-subtle" : "text-ui-fg-muted line-through"}>SMS</span>
              </div>
            </li>
          )
        })}
      </ul>
      <ShipmondoOptionEditDrawer
        option={editOption}
        open={editOption != null}
        onClose={() => setEditOption(null)}
        onSaved={onRefresh}
      />
    </>
  )
}
