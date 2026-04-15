export type Brand = {
  id: string
  name?: string | Record<string, string>
  handle?: string
}

export type Ingredient = {
  id: string
  name?: string | Record<string, string>
  inciName?: string
}

export function getIngredientLabel(ing: Ingredient): string {
  const name = typeof ing.name === "string" ? ing.name : ing.name?.en
  return name ?? ing.inciName ?? ing.id
}

export function getBrandLabel(brand: Brand): string {
  if (typeof brand.name === "string" && brand.name.trim().length > 0) {
    return brand.name
  }

  if (brand.name && typeof brand.name === "object") {
    return (
      brand.name.en ||
      brand.name.da ||
      Object.values(brand.name).find((v) => typeof v === "string" && v.trim().length > 0) ||
      brand.id
    )
  }

  return brand.id
}
