// @ts-nocheck
import { Badge, Checkbox, Label, Switch, Text } from "@medusajs/ui"
import { carrierDisplayLabel } from "./carrierPresentation"
import type { CatalogProductRich } from "./shipmondo-admin.types"

export function WizardStepProducts({
  grouped,
  selectedCarrierKeys,
  selectedProductCodes,
  onToggleProduct,
  onToggleCarrierProducts,
  notificationByCode,
  onNotificationChange,
}: {
  grouped: Map<string, CatalogProductRich[]>
  selectedCarrierKeys: Set<string>
  selectedProductCodes: Set<string>
  onToggleProduct: (code: string) => void
  onToggleCarrierProducts: (carrierKey: string, on: boolean) => void
  notificationByCode: Map<string, { email: boolean; sms: boolean }>
  onNotificationChange: (productCode: string, field: "email" | "sms", value: boolean) => void
}) {
  const entries = Array.from(grouped.entries())
    .filter(([k]) => selectedCarrierKeys.has(k))
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="flex flex-col gap-4">
      {entries.map(([carrierKey, prods]) => {
        const allOn = prods.every((p) => selectedProductCodes.has(p.code))
        const someOn = prods.some((p) => selectedProductCodes.has(p.code))
        const title = carrierDisplayLabel(carrierKey)
        return (
          <div key={carrierKey} className="rounded-lg border border-ui-border-base p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Text weight="plus">{title}</Text>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allOn ? true : someOn ? "indeterminate" : false}
                  onCheckedChange={(c) => onToggleCarrierProducts(carrierKey, c === true)}
                  id={`step2-car-${carrierKey}`}
                />
                <Label htmlFor={`step2-car-${carrierKey}`} className="cursor-pointer text-ui-fg-subtle">
                  Vælg alle
                </Label>
              </div>
            </div>
            <ul className="flex flex-col gap-3">
              {prods.map((p) => {
                const sel = selectedProductCodes.has(p.code)
                const avail = new Set((p.available_services ?? []).map((s) => s.code))
                const req = new Set((p.required_services ?? []).map((s) => s.code))
                const canEmail = avail.has("EMAIL_NT")
                const canSms = avail.has("SMS_NT")
                const notif = notificationByCode.get(p.code) ?? { email: true, sms: true }
                const emailLocked = req.has("EMAIL_NT")
                const smsLocked = req.has("SMS_NT")
                const emailOn = emailLocked ? true : notif.email
                const smsOn = smsLocked ? true : notif.sms
                return (
                  <li
                    key={p.code}
                    className="flex flex-col gap-2 rounded-md border border-ui-border-base bg-ui-bg-subtle-hover/20 p-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      <Checkbox
                        checked={sel}
                        onCheckedChange={() => onToggleProduct(p.code)}
                        id={`p2-${p.code}`}
                      />
                      <div className="min-w-0">
                        <label htmlFor={`p2-${p.code}`} className="cursor-pointer">
                          <Text size="small" weight="plus" className="block">
                            {p.name ?? p.code}
                          </Text>
                        </label>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {p.service_point_product ? (
                            <Badge size="2xsmall" color="blue">
                              Pakkeshop
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {sel ? (
                      <div className="flex flex-col gap-2 sm:items-end">
                        {canEmail ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={emailOn}
                              disabled={emailLocked}
                              onCheckedChange={(v) => onNotificationChange(p.code, "email", v)}
                              id={`em-${p.code}`}
                            />
                            <Label htmlFor={`em-${p.code}`} className="cursor-pointer text-ui-fg-subtle">
                              E-mail{emailLocked ? " (krævet)" : ""}
                            </Label>
                          </div>
                        ) : null}
                        {canSms ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={smsOn}
                              disabled={smsLocked}
                              onCheckedChange={(v) => onNotificationChange(p.code, "sms", v)}
                              id={`sms-${p.code}`}
                            />
                            <Label htmlFor={`sms-${p.code}`} className="cursor-pointer text-ui-fg-subtle">
                              SMS{smsLocked ? " (krævet)" : ""}
                            </Label>
                          </div>
                        ) : null}
                        {!canEmail && !canSms ? (
                          <Text size="xsmall" className="text-ui-fg-muted">
                            Ingen valgfrie adviseringer for dette produkt
                          </Text>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
