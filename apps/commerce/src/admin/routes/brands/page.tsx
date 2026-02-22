import { defineRouteConfig } from '@medusajs/admin-sdk'
import { TagSolid } from '@medusajs/icons'
import {
  Button,
  Container,
  createDataTableColumnHelper,
  DataTable,
  Heading,
  Input,
  Label,
  toast,
  useDataTable,
  usePrompt,
} from '@medusajs/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'

const BASE = import.meta.env.VITE_BACKEND_URL || ''

type Brand = {
  id: string
  name: string
  handle: string
}

type BrandsResponse = {
  brands: Brand[]
  count: number
  limit: number
  offset: number
}

const createColumns = (onEdit: (b: Brand) => void, onDelete: (b: Brand) => void) => {
  const columnHelper = createDataTableColumnHelper<Brand>()
  return [
    columnHelper.accessor('id', {
      header: 'ID',
    }),
    columnHelper.accessor('name', {
      header: 'Name',
    }),
    columnHelper.accessor('handle', {
      header: 'Handle',
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="small" onClick={() => onEdit(row.original)}>
            Edit
          </Button>
          <Button type="button" variant="secondary" size="small" onClick={() => onDelete(row.original)}>
            Delete
          </Button>
        </div>
      ),
    }),
  ]
}

const BrandsPage = () => {
  const [pagination, setPagination] = useState({ pageSize: 15, pageIndex: 0 })
  const [data, setData] = useState<BrandsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editBrand, setEditBrand] = useState<Brand | null>(null)
  const prompt = usePrompt()

  const limit = pagination.pageSize
  const offset = useMemo(() => pagination.pageIndex * limit, [pagination])

  const loadBrands = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/admin/brands?limit=${limit}&offset=${offset}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        setData(null)
      }
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [limit, offset])

  useEffect(() => {
    loadBrands()
  }, [loadBrands])

  const handleDelete = useCallback(
    async (brand: Brand) => {
      const ok = await prompt({
        title: 'Delete brand',
        description: `Are you sure you want to delete "${brand.name}"? This cannot be undone.`,
      })
      if (!ok) return
      try {
        const res = await fetch(`${BASE}/admin/brands/${brand.id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          toast.error(body?.message || 'Failed to delete')
          return
        }
        toast.success(`Brand "${brand.name}" deleted`)
        loadBrands()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Network error')
      }
    },
    [prompt, loadBrands]
  )

  const columns = useMemo(
    () =>
      createColumns(
        (b) => setEditBrand(b),
        handleDelete
      ),
    [handleDelete]
  )

  const table = useDataTable({
    columns,
    data: data?.brands ?? [],
    getRowId: (row) => row.id,
    rowCount: data?.count ?? 0,
    isLoading: loading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-2 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading level="h1">Brands</Heading>
          <Button onClick={() => setCreateOpen(true)}>Create brand</Button>
        </div>
      </div>
      <div className="px-6 py-4">
        <DataTable instance={table}>
          <DataTable.Table />
          <DataTable.Pagination />
        </DataTable>
      </div>
      {createOpen && (
        <BrandFormDrawer
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false)
            loadBrands()
          }}
        />
      )}
      {editBrand && (
        <BrandFormDrawer
          brand={editBrand}
          onClose={() => setEditBrand(null)}
          onSuccess={() => {
            setEditBrand(null)
            loadBrands()
          }}
        />
      )}
    </Container>
  )
}

type BrandFormDrawerProps = {
  brand?: Brand
  onClose: () => void
  onSuccess: () => void
}

const BrandFormDrawer = ({ brand, onClose, onSuccess }: BrandFormDrawerProps) => {
  const [name, setName] = useState(brand?.name ?? '')
  const [handle, setHandle] = useState(brand?.handle ?? '')
  const [saving, setSaving] = useState(false)
  const isEdit = !!brand

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        const res = await fetch(`${BASE}/admin/brands/${brand.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), handle: handle.trim() || undefined }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          toast.error(body?.message || 'Failed to update')
          return
        }
        toast.success('Brand updated')
      } else {
        const res = await fetch(`${BASE}/admin/brands`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), handle: handle.trim() || undefined }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          toast.error(body?.message || 'Failed to create')
          return
        }
        toast.success('Brand created')
      }
      onSuccess()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-ui-border-base bg-ui-bg-base p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <Heading level="h2" className="mb-4">
          {isEdit ? 'Edit brand' : 'Create brand'}
        </Heading>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="brand-name">Name</Label>
            <Input
              id="brand-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Brand name"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="brand-handle">Handle (optional)</Label>
            <Input
              id="brand-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="brand-handle"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: 'Brands',
  icon: TagSolid,
})

export default BrandsPage
