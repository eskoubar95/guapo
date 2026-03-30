// @ts-nocheck
import { Text } from "@medusajs/ui"
import { carrierDisplayLabel } from "./carrierPresentation"
import type { CatalogProductRich } from "./shipmondo-admin.types"

export function WizardStepConfirm({
  grouped,
  selectedCarrierKeys,
  selectedProductCodes,
  notificationByCode,
}: {
  grouped: Map<string, CatalogProductRich[]>
  selectedCarrierKeys: Set<string>
  selectedProductCodes: Set<string>
  notificationByCode: Map<string, { email: boolean; sms: boolean }>
}) {
  const lines: { carrier: string; name: string; code: string; email: boolean; sms: boolean }[] = []
  for (const [carrierKey, prods] of grouped.entries()) {
    if (!selectedCarrierKeys.has(carrierKey)) continue
    for (const p of prods) {
      if (!selectedProductCodes.has(p.code)) continue
      const n = notificationByCode.get(p.code) ?? { email: true, sms: true }
      lines.push({
        carrier: carrierDisplayLabel(carrierKey),
        name: p.name ?? p.code,
        code: p.code,
        email: n.email,
        sms: n.sms,
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Text size="small" className="text-ui-fg-subtle">
        Følgende tilføjes eller opdateres som leveringsmuligheder. Priser sættes under fanen <strong>Priser</strong>.
      </Text>
      <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-lg border border-ui-border-base p-3">
        {lines.map((row) => (
          <li key={row.code} className="flex flex-col gap-0.5 border-b border-ui-border-base pb-2 last:border-0 last:pb-0">
            <Text size="small" weight="plus">
              {row.name}
            </Text>
            <Text size="xsmall" className="text-ui-fg-subtle">
              {row.carrier}
              {row.email || row.sms
                ? ` · ${row.email ? "E-mail" : ""}${row.email && row.sms ? " · " : ""}${row.sms ? "SMS" : ""}`
                : ""}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  )
}
