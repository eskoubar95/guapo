import { defineWidgetConfig } from '@medusajs/admin-sdk'
import type { DetailWidgetProps } from '@medusajs/framework/types'
import {
  Badge,
  Button,
  Container,
  Heading,
  Select,
  Text,
  Textarea,
  toast,
} from '@medusajs/ui'
import { useCallback, useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_BACKEND_URL || ''

type Brand = { id: string; name: string; handle: string }
type Ingredient = {
  id: string
  name?: string | Record<string, string>
  inciName?: string
}

function getIngredientLabel(ing: Ingredient): string {
  const name = typeof ing.name === 'string' ? ing.name : ing.name?.en
  return name ?? ing.inciName ?? ing.id
}

const ProductBrandIngredientsWidget = ({ data: product }: DetailWidgetProps) => {
  // Brand state
  const [brands, setBrands] = useState<Brand[]>([])
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null)
  const [brandLoading, setBrandLoading] = useState(true)

  // Ingredients state
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [currentIngredients, setCurrentIngredients] = useState<Ingredient[]>([])
  const [payloadProductId, setPayloadProductId] = useState<string | null>(null)
  const [ingredientsLoading, setIngredientsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [rawList, setRawList] = useState('')
  const [addSelectValue, setAddSelectValue] = useState<string>('')

  const loadBrands = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/admin/brands?limit=500`, {
        credentials: 'include',
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
        credentials: 'include',
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
        credentials: 'include',
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
      const res = await fetch(
        `${BASE}/admin/products/${product.id}/ingredients`,
        { credentials: 'include' },
      )
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
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: value || null }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.message || 'Failed to update brand')
        return
      }
      setCurrentBrandId(value)
      toast.success('Brand updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleParse = async () => {
    if (!product?.id || parsing) return
    setParsing(true)
    try {
      const res = await fetch(
        `${BASE}/admin/products/${product.id}/ingredients/parse`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawList }),
        },
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body?.message || 'Parse failed')
        return
      }
      setRawList('')
      toast.success(
        `Parsed: ${body.found ?? 0} found, ${body.created ?? 0} created`,
      )
      await loadIngredients()
      await loadCurrentIngredients()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Parse failed')
    } finally {
      setParsing(false)
    }
  }

  const handleAddIngredient = async (id: string) => {
    if (!product?.id || saving) return
    const ing = allIngredients.find((i) => i.id === id)
    if (!ing) return
    setAddSelectValue('')
    const newIds = [...currentIngredients.map((i) => i.id), id]
    setSaving(true)
    try {
      const res = await fetch(
        `${BASE}/admin/products/${product.id}/ingredients`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredient_ids: newIds }),
        },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.message || 'Failed to add')
        return
      }
      const json = await res.json()
      setCurrentIngredients(json.ingredients ?? [...currentIngredients, ing])
      toast.success('Ingredient added')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveIngredient = async (id: string) => {
    if (!product?.id || saving) return
    const newIds = currentIngredients
      .filter((i) => i.id !== id)
      .map((i) => i.id)
    setSaving(true)
    try {
      const res = await fetch(
        `${BASE}/admin/products/${product.id}/ingredients`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredient_ids: newIds }),
        },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.message || 'Failed to remove')
        return
      }
      const json = await res.json()
      setCurrentIngredients(json.ingredients ?? [])
      toast.success('Ingredient removed')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const selectedIds = new Set(currentIngredients.map((i) => i.id))
  const availableToAdd = allIngredients.filter((i) => !selectedIds.has(i.id))

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Brand & Ingredients</Heading>
      </div>
      <div className="space-y-6 px-6 py-4">
        {/* Brand */}
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
              value={currentBrandId ?? '__none__'}
              onValueChange={(v) =>
                handleBrandChange(v === '__none__' ? null : v)
              }
              disabled={saving}
            >
              <Select.Trigger>
                <Select.Value placeholder="Select brand" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="__none__">No brand</Select.Item>
                {brands.map((b) => (
                  <Select.Item key={b.id} value={b.id}>
                    {b.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          )}
        </div>

        {/* Ingredients */}
        <div className="space-y-4 border-t border-ui-border-base pt-4">
          <Text size="small" className="font-medium text-ui-fg-base">
            Ingredients
          </Text>
          {!payloadProductId && (
            <Text size="small" className="text-ui-fg-subtle">
              Sync product to Payload first
            </Text>
          )}

          <div className="space-y-2">
            <Text size="small" className="text-ui-fg-subtle">
              Paste comma-separated list (e.g. Water, Glycerin, Niacinamide)
            </Text>
            <Textarea
              value={rawList}
              onChange={(e) => setRawList(e.target.value)}
              placeholder="Water, Glycerin, Niacinamide, ..."
              disabled={parsing || !payloadProductId}
              className="min-h-[80px]"
            />
            <Button
              size="small"
              onClick={handleParse}
              disabled={parsing || !rawList.trim() || !payloadProductId}
            >
              {parsing ? 'Parsing…' : 'Parse & link'}
            </Button>
          </div>

          <div className="space-y-2">
            <Text size="small" className="text-ui-fg-subtle">
              Add ingredient manually
            </Text>
            <Select
              value={addSelectValue || '__none__'}
              onValueChange={(v) => {
                if (v && v !== '__none__') handleAddIngredient(v)
                setAddSelectValue('')
              }}
              disabled={
                saving || !payloadProductId || availableToAdd.length === 0
              }
            >
              <Select.Trigger>
                <Select.Value placeholder="Select ingredient to add" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="__none__">
                  Select ingredient to add
                </Select.Item>
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
                    onClick={() => handleRemoveIngredient(ing.id)}
                  >
                    {getIngredientLabel(ing)}
                    <span className="ml-1 opacity-70">×</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: 'product.details.after',
})

export default ProductBrandIngredientsWidget
