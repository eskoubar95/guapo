/** Human-friendly carrier labels + avatar styling (no logos from API). */

const KNOWN: Record<string, { label: string; initials: string; className: string }> = {
  gls: { label: "GLS", initials: "GL", className: "bg-emerald-600/90 text-white" },
  pdk: { label: "PostNord", initials: "PN", className: "bg-sky-600/90 text-white" },
  postdk: { label: "PostNord", initials: "PN", className: "bg-sky-600/90 text-white" },
  dao: { label: "DAO", initials: "DA", className: "bg-rose-600/90 text-white" },
  bring: { label: "Bring", initials: "BR", className: "bg-amber-600/90 text-white" },
  dhl: { label: "DHL", initials: "DH", className: "bg-yellow-500/90 text-slate-900" },
  ups: { label: "UPS", initials: "UP", className: "bg-amber-800/90 text-white" },
  fedex: { label: "FedEx", initials: "FX", className: "bg-violet-600/90 text-white" },
}

export function carrierKeyFromCode(code?: string): string {
  return (code ?? "unknown").toLowerCase().trim() || "unknown"
}

export function carrierDisplayLabel(carrierKey: string): string {
  const k = carrierKey.toLowerCase()
  if (KNOWN[k]) return KNOWN[k].label
  if (k.length <= 1) return k.toUpperCase()
  return k.charAt(0).toUpperCase() + k.slice(1)
}

export function carrierAvatar(carrierKey: string): { initials: string; className: string } {
  const k = carrierKey.toLowerCase()
  if (KNOWN[k]) {
    return { initials: KNOWN[k].initials, className: KNOWN[k].className }
  }
  const label = carrierDisplayLabel(carrierKey)
  const initials =
    label.length >= 2 ? label.slice(0, 2).toUpperCase() : `${label.slice(0, 1).toUpperCase()}·`
  return { initials, className: "bg-ui-bg-component text-ui-fg-base border border-ui-border-base" }
}
