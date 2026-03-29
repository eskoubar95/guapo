import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

import { BrandSection } from "./_components/BrandSection"
import { IngredientsSection } from "./_components/IngredientsSection"
import type { Brand, Ingredient } from "./_components/product-brand-ingredients.types"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

const ProductBrandIngredientsWidget = ({ data: product }: DetailWidgetProps) => {
  const [brands, setBrands] = useState<Brand[]>([])
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null)
  const [brandLoading, setBrandLoading] = useState(true)

  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [currentIngredients, setCurrentIngredients] = useState<Ingredient[]>([])
  const [payloadProductId, setPayloadProductId] = useState<string | null>(null)
  const [ingredientsLoading, setIngredientsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [rawList, setRawList] = useState("")
  const [addSelectValue, setAddSelectValue] = useState("")

  const loadBrands = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/admin/brands?limit=500`, {
        credentials: "include",
      })
      if (res.ok) {
        const json = await res.json()
        setBrands(json.brands ?? [])
      }
    } catch {
      setBrands([])
    }
  }, [])

  const loadCurrentBrand = useCallback(async () => {
    if (!product?.id) {
      setBrandLoading(false)
      return
    }
    setBrandLoading(true)
    try {
      const res = await fetch(`${BASE}/admin/products/${product.id}/brand`, {
        credentials: "include",
      })
      if (res.ok) {
        const json = await res.json()
        setCurrentBrandId(json.brand?.id ?? null)
      }
    } catch {
      setCurrentBrandId(null)
    } finally {
      setBrandLoading(false)
    }
  }, [product?.id])

  const loadIngredients = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/admin/ingredients?limit=500`, {
        credentials: "include",
      })
      if (res.ok) {
        const json = await res.json()
        setAllIngredients(json.ingredients ?? [])
      }
    } catch {
      setAllIngredients([])
    }
  }, [])

  const loadCurrentIngredients = useCallback(async () => {
    if (!product?.id) {
      setIngredientsLoading(false)
      return
    }
    setIngredientsLoading(true)
    try {
      const res = await fetch(`${BASE}/admin/products/${product.id}/ingredients`, {
        credentials: "include",
      })
      if (res.ok) {
        const json = await res.json()
        setCurrentIngredients(json.ingredients ?? [])
        setPayloadProductId(json.payloadProductId ?? null)
      }
    } catch {
      setCurrentIngredients([])
      setPayloadProductId(null)
    } finally {
      setIngredientsLoading(false)
    }
  }, [product?.id])

  useEffect(() => {
    loadBrands()
  }, [loadBrands])

  useEffect(() => {
    loadCurrentBrand()
  }, [loadCurrentBrand])

  useEffect(() => {
    loadIngredients()
  }, [loadIngredients])

  useEffect(() => {
    loadCurrentIngredients()
  }, [loadCurrentIngredients])

  const handleBrandChange = async (value: string | null) => {
    if (!product?.id || saving) return
    setSaving(true)
    try {
      const res = await fetch(`${BASE}/admin/products/${product.id}/brand`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: value || null }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.message || "Failed to update brand")
        return
      }
      setCurrentBrandId(value)
      toast.success("Brand updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error")
    } finally {
      setSaving(false)
    }
  }

  const handleParse = async () => {
    if (!product?.id || parsing) return
    setParsing(true)
    try {
      const res = await fetch(`${BASE}/admin/products/${product.id}/ingredients/parse`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawList }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body?.message || "Parse failed")
        return
      }
      setRawList("")
      toast.success(`Parsed: ${body.found ?? 0} found, ${body.created ?? 0} created`)
      await loadIngredients()
      await loadCurrentIngredients()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Parse failed")
    } finally {
      setParsing(false)
    }
  }

  const handleAddIngredient = async (id: string) => {
    if (!product?.id || saving) return
    const ing = allIngredients.find((i) => i.id === id)
    if (!ing) return
    setAddSelectValue("")
    const newIds = [...currentIngredients.map((i) => i.id), id]
    setSaving(true)
    try {
      const res = await fetch(`${BASE}/admin/products/${product.id}/ingredients`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient_ids: newIds }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.message || "Failed to add")
        return
      }
      const json = await res.json()
      setCurrentIngredients(json.ingredients ?? [...currentIngredients, ing])
      toast.success("Ingredient added")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveIngredient = async (id: string) => {
    if (!product?.id || saving) return
    const newIds = currentIngredients.filter((i) => i.id !== id).map((i) => i.id)
    setSaving(true)
    try {
      const res = await fetch(`${BASE}/admin/products/${product.id}/ingredients`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredient_ids: newIds }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.message || "Failed to remove")
        return
      }
      const json = await res.json()
      setCurrentIngredients(json.ingredients ?? currentIngredients.filter((i) => i.id !== id))
      toast.success("Ingredient removed")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Brand & Ingredients</Heading>
      </div>
      <div className="space-y-6 px-6 py-4">
        <BrandSection
          brands={brands}
          currentBrandId={currentBrandId}
          brandLoading={brandLoading}
          saving={saving}
          onBrandChange={handleBrandChange}
        />
        <IngredientsSection
          payloadProductId={payloadProductId}
          allIngredients={allIngredients}
          currentIngredients={currentIngredients}
          ingredientsLoading={ingredientsLoading}
          saving={saving}
          parsing={parsing}
          rawList={rawList}
          addSelectValue={addSelectValue}
          onRawListChange={setRawList}
          onParse={handleParse}
          onAddSelectChange={setAddSelectValue}
          onAddIngredient={handleAddIngredient}
          onRemoveIngredient={handleRemoveIngredient}
        />
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductBrandIngredientsWidget
