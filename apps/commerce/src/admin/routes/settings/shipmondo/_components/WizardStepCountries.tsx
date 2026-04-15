// @ts-nocheck
import { Label, Text } from "@medusajs/ui"

const COUNTRY_OPTIONS = ["DK", "SE", "NO", "FI", "DE", "NL", "AT", "FR", "GB"].map((c) => ({ value: c, label: c }))

export function WizardStepCountries({
  receiver,
  sender,
  onReceiverChange,
  onSenderChange,
}: {
  receiver: string
  sender: string
  onReceiverChange: (v: string) => void
  onSenderChange: (v: string) => void
}) {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Text size="small" className="text-ui-fg-subtle">
        Vælg korridor (modtager og afsender). På næste trin henter vi tilgængelige carriers fra Shipmondo; derefter
        produkter pr. valgt carrier med samme lande + <code className="text-xs">carrier_code</code>.
      </Text>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="wiz-receiver">Modtagerland</Label>
          <select
            id="wiz-receiver"
            className="bg-ui-bg-field border-ui-border-base text-ui-fg-base w-full rounded-md border px-3 py-2.5 text-sm"
            value={receiver}
            onChange={(e) => onReceiverChange(e.target.value)}
          >
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="wiz-sender">Afsenderland</Label>
          <select
            id="wiz-sender"
            className="bg-ui-bg-field border-ui-border-base text-ui-fg-base w-full rounded-md border px-3 py-2.5 text-sm"
            value={sender}
            onChange={(e) => onSenderChange(e.target.value)}
          >
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
