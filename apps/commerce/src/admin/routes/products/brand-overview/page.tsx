import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TagSolid } from "@medusajs/icons"
import {
  Badge,
  Container,
  createDataTableColumnHelper,
  DataTable,
  Heading,
  Text,
  useDataTable,
} from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"

const BASE = import.meta.env.VITE_BACKEND_URL || ""

type ProductRow = {
  id: string
  title: string
  status?: string
  thumbnail?: string | null
  handle?: string
  brand?: { id: string; name: string; handle: string } | null
}

type ProductsResponse = {
  products?: ProductRow[]
  count?: number
}

function statusColor(status: string | undefined): "green" | "orange" | "grey" {
  if (status === "published") return "green"
  if (status === "draft") return "orange"
  return "grey"
}

function thumbnailSrc(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("http")) return url
  const base = BASE.replace(/\/$/, "")
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`
}

const columnHelper = createDataTableColumnHelper<ProductRow>()

const columns = [
  columnHelper.display({
    id: "thumb",
    header: "",
    cell: ({ row }) => {
      const src = thumbnailSrc(row.original.thumbnail)
      return (
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-ui-bg-subtle">
          {src ? (
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs text-ui-fg-muted">—</span>
          )}
        </div>
      )
    },
  }),
  columnHelper.accessor("title", {
    header: "Title",
    cell: ({ row }) => (
      <Link
        to={`/products/${row.original.id}`}
        className="text-sm text-ui-fg-interactive hover:underline line-clamp-2"
      >
        {row.original.title}
      </Link>
    ),
  }),
  columnHelper.display({
    id: "brand",
    header: "Brand",
    cell: ({ row }) => {
      const b = row.original.brand
      const label = b?.name?.trim() || "—"
      return (
        <Text size="small" leading="compact" className="text-ui-fg-base">
          {label}
        </Text>
      )
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      const s = getValue() ?? "—"
      return <Badge color={statusColor(s)}>{s}</Badge>
    },
  }),
  columnHelper.accessor("handle", {
    header: "Handle",
    cell: ({ getValue }) => (
      <Text size="small" leading="compact" className="font-mono text-ui-fg-muted">
        {getValue() ?? "—"}
      </Text>
    ),
  }),
]

const FIELDS = "+brand.*,id,title,status,thumbnail,handle"

const ProductBrandOverviewPage = () => {
  const [pagination, setPagination] = useState({ pageSize: 15, pageIndex: 0 })
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [data, setData] = useState<ProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [debouncedSearch])

  const limit = pagination.pageSize
  const offset = pagination.pageIndex * limit

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("limit", String(limit))
      params.set("offset", String(offset))
      params.set("fields", FIELDS)
      const q = debouncedSearch.trim()
      if (q) params.set("q", q)
      const res = await fetch(`${BASE}/admin/products?${params.toString()}`, {
        credentials: "include",
      })
      if (res.ok) {
        setData(await res.json())
      } else {
        setData(null)
      }
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [limit, offset, debouncedSearch])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const products = data?.products ?? []
  const rowCount = data?.count ?? 0

  const table = useDataTable({
    columns,
    data: products,
    getRowId: (row) => row.id,
    rowCount,
    isLoading: loading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    search: {
      state: searchInput,
      onSearchChange: setSearchInput,
    },
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-2 px-6 py-4">
        <Heading level="h1">Products — brand</Heading>
        <Text size="small" className="text-ui-fg-muted max-w-2xl">
          Same catalogue as the default product list, with an extra Brand column (from the product↔brand
          link). Use the default Products view for Medusa actions; use this when you need brand at a
          glance.
        </Text>
      </div>
      <div className="px-6 py-4">
        <DataTable instance={table}>
          <DataTable.Toolbar>
            <div className="flex flex-1 items-center gap-2">
              <DataTable.Search placeholder="Search products…" />
            </div>
          </DataTable.Toolbar>
          <DataTable.Table />
          <DataTable.Pagination />
        </DataTable>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Brand overview",
  icon: TagSolid,
  nested: "/products",
  rank: 15,
})

export default ProductBrandOverviewPage
