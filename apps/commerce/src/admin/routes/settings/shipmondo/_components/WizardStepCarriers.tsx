// @ts-nocheck
import { Checkbox, Text } from "@medusajs/ui"
import type { ApiCarrierOption } from "./shipmondo-admin.types"

export function WizardStepCarriers({
  carriers,
  selectedCarrierKeys,
  onToggleCarrier,
  loading,
  receiver,
  sender,
}: {
  carriers: ApiCarrierOption[]
  selectedCarrierKeys: Set<string>
  onToggleCarrier: (carrierKey: string, on: boolean) => void
  loading: boolean
  receiver: string
  sender: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle-hover/20 px-4 py-3">
        <Text size="small" className="text-ui-fg-subtle">
          Korridor: <strong>{sender}</strong> → <strong>{receiver}</strong>
        </Text>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 py-8 text-center">
          <Text className="text-ui-fg-subtle">Henter carriers fra Shipmondo…</Text>
        </div>
      ) : carriers.length === 0 ? (
        <Text className="text-ui-fg-subtle">Ingen carriers fra API — tjek credentials og miljø (sandbox/prod).</Text>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {carriers.map((c) => {
            const key = c.code.toLowerCase()
            const on = selectedCarrierKeys.has(key)
            return (
              <li
                key={key}
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  on ? "border-ui-border-interactive bg-ui-bg-subtle-hover/30" : "border-ui-border-base"
                }`}
              >
                <div className="min-w-0">
                  <Text weight="plus" className="block truncate">
                    {c.name}
                  </Text>
                  <Text size="xsmall" className="font-mono text-ui-fg-muted">
                    {c.code}
                  </Text>
                </div>
                <Checkbox
                  checked={on}
                  onCheckedChange={(v) => onToggleCarrier(key, v === true)}
                  id={`car-${key}`}
                  aria-label={`Vælg ${c.name}`}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
