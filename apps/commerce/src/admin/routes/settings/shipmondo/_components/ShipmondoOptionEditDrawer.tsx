// @ts-nocheck
import { Button, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { buildServiceCodesString, parseServiceCodes } from "./shipmondo-service-codes"
import type { OptionRow } from "./shipmondo-admin.types"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

export function productCodeFromOption(opt: OptionRow): string | undefined {
  const d = opt.data
  if (!d || typeof d !== "object") return undefined
  if (typeof d.product_code === "string" && d.product_code.length > 0) return d.product_code
  if (typeof d.id === "string" && d.id.length > 0 && !d.id.startsWith("so_")) return d.id
  return undefined
}

export function ShipmondoOptionEditDrawer({
  option,
  open,
  onClose,
  onSaved,
}: {
  option: OptionRow | null
  open: boolean
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState("")
  const [emailNt, setEmailNt] = useState(true)
  const [smsNt, setSmsNt] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!option) return
    setName(option.name ?? "")
    const codes = typeof option.data?.service_codes === "string" ? option.data.service_codes : ""
    const parsed = parseServiceCodes(codes)
    setEmailNt(parsed.email)
    setSmsNt(parsed.sms)
  }, [option])

  const handleSave = async () => {
    if (!option) return
    const code = productCodeFromOption(option)
    if (!code) {
      toast.error("Mangler product_code på option")
      return
    }
    setSaving(true)
    try {
      const service_codes = buildServiceCodesString(emailNt, smsNt)
      const res = await fetch(`${BASE}/admin/shipmondo/options/${option.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          data: { service_codes },
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        toast.error(j?.message || "Kunne ikke gemme")
        return
      }
      toast.success("Gemt")
      await onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fejl")
    } finally {
      setSaving(false)
    }
  }

  if (!open || !option) return null

  const pc = productCodeFromOption(option)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ui-bg-overlay/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shipmondo-edit-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-ui-border-base bg-ui-bg-base p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Heading id="shipmondo-edit-title" level="h2" className="mb-1 text-base">
          Rediger leveringsmulighed
        </Heading>
        <Text size="small" className="text-ui-fg-subtle mb-4 block">
          {pc ?? option.id}
        </Text>

        <div className="mb-4 flex flex-col gap-1">
          <Label>Navn</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vises i checkout" />
        </div>
        <div className="mb-6 flex flex-col gap-3">
          <Label>Adviseringer</Label>
          <div className="flex items-center justify-between gap-4">
            <Text size="small">E-mail (EMAIL_NT)</Text>
            <Switch checked={emailNt} onCheckedChange={setEmailNt} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Text size="small">SMS (SMS_NT)</Text>
            <Switch checked={smsNt} onCheckedChange={setSmsNt} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuller
          </Button>
          <Button type="button" variant="primary" disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Gemmer…" : "Gem"}
          </Button>
        </div>
      </div>
    </div>
  )
}
