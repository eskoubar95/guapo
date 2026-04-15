import { Select, Text } from "@medusajs/ui"

import { getBrandLabel, type Brand } from "./product-brand-ingredients.types"

type Props = {
  brands: Brand[]
  currentBrandId: string | null
  brandLoading: boolean
  saving: boolean
  onBrandChange: (value: string | null) => void
}

export function BrandSection({
  brands,
  currentBrandId,
  brandLoading,
  saving,
  onBrandChange,
}: Props) {
  return (
    <div className="space-y-2">
      <Text size="small" className="font-medium text-ui-fg-base">
        Brand
      </Text>
      {brandLoading ? (
        <Text size="small" className="text-ui-fg-subtle">
          Loading…
        </Text>
      ) : (
        <Select
          value={currentBrandId ?? "__none__"}
          onValueChange={(v) => onBrandChange(v === "__none__" ? null : v)}
          disabled={saving}
        >
          <Select.Trigger>
            <Select.Value placeholder="Select brand" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__none__">No brand</Select.Item>
            {brands.map((b) => (
              <Select.Item key={b.id} value={b.id}>
                {getBrandLabel(b)}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      )}
    </div>
  )
}
