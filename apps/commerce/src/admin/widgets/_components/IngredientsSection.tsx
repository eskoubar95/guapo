import { Badge, Button, Select, Text, Textarea } from "@medusajs/ui"

import type { Ingredient } from "./product-brand-ingredients.types"
import { getIngredientLabel } from "./product-brand-ingredients.types"

type Props = {
  payloadProductId: string | null
  allIngredients: Ingredient[]
  currentIngredients: Ingredient[]
  ingredientsLoading: boolean
  saving: boolean
  parsing: boolean
  rawList: string
  addSelectValue: string
  onRawListChange: (v: string) => void
  onParse: () => void
  onAddSelectChange: (v: string) => void
  onAddIngredient: (id: string) => void
  onRemoveIngredient: (id: string) => void
}

export function IngredientsSection({
  payloadProductId,
  allIngredients,
  currentIngredients,
  ingredientsLoading,
  saving,
  parsing,
  rawList,
  addSelectValue,
  onRawListChange,
  onParse,
  onAddSelectChange,
  onAddIngredient,
  onRemoveIngredient,
}: Props) {
  const selectedIds = new Set(currentIngredients.map((i) => i.id))
  const availableToAdd = allIngredients.filter((i) => !selectedIds.has(i.id))

  return (
    <div className="space-y-4 border-t border-ui-border-base pt-4">
      <Text size="small" className="font-medium text-ui-fg-base">
        Ingredients
      </Text>
      {!payloadProductId ? (
        <Text size="small" className="text-ui-fg-subtle">
          Sync product to Payload first
        </Text>
      ) : null}

      <div className="space-y-2">
        <Text size="small" className="text-ui-fg-subtle">
          Paste comma-separated list (e.g. Water, Glycerin, Niacinamide)
        </Text>
        <Textarea
          value={rawList}
          onChange={(e) => onRawListChange(e.target.value)}
          placeholder="Water, Glycerin, Niacinamide, ..."
          disabled={parsing || !payloadProductId}
          className="min-h-[80px]"
        />
        <Button
          size="small"
          onClick={onParse}
          disabled={parsing || !rawList.trim() || !payloadProductId}
        >
          {parsing ? "Parsing…" : "Parse & link"}
        </Button>
      </div>

      <div className="space-y-2">
        <Text size="small" className="text-ui-fg-subtle">
          Add ingredient manually
        </Text>
        <Select
          value={addSelectValue || "__none__"}
          onValueChange={(v) => {
            onAddSelectChange("")
            if (v && v !== "__none__") onAddIngredient(v)
          }}
          disabled={saving || !payloadProductId || availableToAdd.length === 0}
        >
          <Select.Trigger>
            <Select.Value placeholder="Select ingredient to add" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__none__">Select ingredient to add</Select.Item>
            {availableToAdd.map((i) => (
              <Select.Item key={i.id} value={i.id}>
                {getIngredientLabel(i)}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <div className="space-y-2">
        <Text size="small" className="text-ui-fg-subtle">
          Current ingredients ({currentIngredients.length})
        </Text>
        {ingredientsLoading ? (
          <Text size="small" className="text-ui-fg-subtle">
            Loading…
          </Text>
        ) : currentIngredients.length === 0 ? (
          <Text size="small" className="text-ui-fg-subtle">
            No ingredients linked
          </Text>
        ) : (
          <div className="flex flex-wrap gap-1">
            {currentIngredients.map((ing) => (
              <Badge
                key={ing.id}
                size="small"
                className="cursor-pointer"
                onClick={() => onRemoveIngredient(ing.id)}
              >
                {getIngredientLabel(ing)}
                <span className="ml-1 opacity-70">×</span>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
