import { Button, Input, Label, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import {
  formatWeightIntervalLabel,
  mergePriceBandsWithWeightIntervals,
} from "../../../../../modules/shipmondo/lib/merge-price-bands-weight-intervals"
import { parseWeightIntervals } from "../../../../../modules/shipmondo/lib/products"
import type { OptionRow, PriceBand } from "./shipmondo-admin.types"

/** Flat + weight bands — interval boundaries from Shipmondo when `weight_intervals` exist on the option. */
export function OptionPriceForm({
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
  const intervals = parseWeightIntervals(option.data?.weight_intervals) ?? []
  const lockedIntervals = intervals.length > 0

  const [flatInput, setFlatInput] = useState(flat === "" ? "" : String(flat))
  const [bands, setBands] = useState<PriceBand[]>([])

  useEffect(() => {
    setFlatInput(flat === "" ? "" : String(flat))
  }, [flat])

  useEffect(() => {
    const rawBands = option.data?.price_bands ?? []
    const ivs = parseWeightIntervals(option.data?.weight_intervals) ?? []
    if (ivs.length > 0) {
      setBands(mergePriceBandsWithWeightIntervals(ivs, rawBands))
    } else {
      setBands(rawBands.length > 0 ? [...rawBands] : [])
    }
  }, [
    option.id,
    JSON.stringify(option.data?.price_bands ?? []),
    JSON.stringify(option.data?.weight_intervals ?? []),
  ])

  const addBand = () => setBands((b) => [...b, { max_grams: 2000, amount_minor: 3120 }])
  const removeBand = (i: number) => setBands((b) => b.filter((_, j) => j !== i))
  const updateBand = (i: number, field: "max_grams" | "amount_minor", value: number) =>
    setBands((b) => b.map((row, j) => (j !== i ? row : { ...row, [field]: value })))

  const updateAmountOnly = (i: number, amount_minor: number) =>
    setBands((b) => b.map((row, j) => (j !== i ? row : { ...row, amount_minor })))

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
          <Label>Flat pris (øre, ex. moms)</Label>
          <Input
            type="number"
            min={0}
            value={flatInput}
            onChange={(e) => setFlatInput(e.target.value)}
            placeholder="f.eks. 3120"
          />
        </div>
      </div>

      <div className="mb-3">
        <Label className="mb-2 block">Vægtbands (op til X gram → pris i øre, ex. moms)</Label>
        {lockedIntervals ? (
          <Text size="small" className="text-ui-fg-subtle mb-3 block">
            Intervaller kommer fra Shipmondo — indtast kun pris pr. interval. Brug flat pris ovenfor hvis I ikke vil bruge
            vægtbands.
          </Text>
        ) : (
          <Text size="small" className="text-ui-fg-subtle mb-2 block">
            Fx 0–2 kg: max_grams 2000, pris 3120. Næste band fx 2–5 kg: max_grams 5000, pris 3920 (tilpas efter jeres takst).
          </Text>
        )}
        <ul className="flex flex-col gap-2">
          {bands.map((row, i) => (
            <li key={lockedIntervals ? `${row.max_grams}-${i}` : i} className="flex flex-wrap items-center gap-2">
              {lockedIntervals && intervals[i] ? (
                <Text size="small" className="min-w-[140px] text-ui-fg-subtle">
                  {formatWeightIntervalLabel(intervals[i])}
                </Text>
              ) : (
                <>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Gram"
                    value={row.max_grams}
                    onChange={(e) => updateBand(i, "max_grams", Math.round(Number(e.target.value) || 0))}
                    className="w-28"
                  />
                  <span className="text-ui-fg-subtle">gram →</span>
                </>
              )}
              <Input
                type="number"
                min={0}
                placeholder="Øre"
                value={row.amount_minor}
                onChange={(e) =>
                  lockedIntervals
                    ? updateAmountOnly(i, Math.round(Number(e.target.value) || 0))
                    : updateBand(i, "amount_minor", Math.round(Number(e.target.value) || 0))
                }
                className="w-28"
              />
              <span className="text-ui-fg-subtle">øre</span>
              {!lockedIntervals ? (
                <Button type="button" variant="transparent" size="small" onClick={() => removeBand(i)}>
                  Fjern
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {!lockedIntervals ? (
          <Button type="button" variant="secondary" size="small" className="mt-2" onClick={addBand}>
            Tilføj band
          </Button>
        ) : null}
      </div>

      <Button type="button" size="small" disabled={saving} onClick={handleSave}>
        {saving ? "Gemmer…" : "Gem priser"}
      </Button>
    </li>
  )
}
