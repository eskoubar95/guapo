export type Brand = { id: string; name: string; handle: string }

export type Ingredient = {
  id: string
  name?: string | Record<string, string>
  inciName?: string
}

export function getIngredientLabel(ing: Ingredient): string {
  const name = typeof ing.name === "string" ? ing.name : ing.name?.en
  return name ?? ing.inciName ?? ing.id
}
