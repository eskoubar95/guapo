import { defineRouteConfig } from '@medusajs/admin-sdk'
import { Button, Container, Heading, Text, toast } from '@medusajs/ui'
import { useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_BACKEND_URL || ''

type SyncStatus = Record<string, { lastSyncAt: string | null }>

const LABELS: Record<string, string> = {
  products: 'Products',
  categories: 'Categories',
  brands: 'Brands',
  product_types: 'Product types',
}

const SYNC_AVAILABLE: Record<string, boolean> = {
  products: true,
  categories: true,
  brands: true,
  product_types: true,
}

const PayloadSettingsPage = () => {
  const [syncing, setSyncing] = useState<string | null>(null)
  const [status, setStatus] = useState<SyncStatus | null>(null)

  const loadStatus = async () => {
    try {
      const res = await fetch(`${BASE}/admin/payload/sync/status`, {
        credentials: 'include',
      })
      if (res.ok) setStatus(await res.json())
    } catch {
      setStatus(null)
    }
  }

  useEffect(() => {
    loadStatus()
  }, [])

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Never'
    try {
      const d = new Date(iso)
      return d.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return iso
    }
  }

  const runSync = async (collection: string) => {
    setSyncing(collection)
    try {
      const res = await fetch(`${BASE}/admin/payload/sync/${collection}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Not logged in. Log in to the admin and try again.')
        } else {
          toast.error(`Sync failed: ${body?.message || res.statusText}`)
        }
        return
      }
      toast.success(`${LABELS[collection] || collection} sync started`)
      await loadStatus()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Network error')
    } finally {
      setSyncing(null)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-2 px-6 py-4">
        <Heading level="h1">Payload CMS sync</Heading>
        <Text className="text-ui-fg-subtle">
          Sync Medusa data to Payload so editors can add content (SEO, guidance, etc.).
          Only collections that support sync have an active button; others are planned for later phases.
        </Text>
      </div>
      <div className="flex flex-col gap-4 px-6 py-4">
        {Object.entries(LABELS).map(([key, label]) => {
          const lastSyncAt = status?.[key]?.lastSyncAt ?? null
          const available = SYNC_AVAILABLE[key]
          return (
            <div
              key={key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ui-border-base p-4"
            >
              <div>
                <Text weight="plus" className="text-ui-fg-base">
                  {label}
                </Text>
                <Text size="small" className="text-ui-fg-subtle">
                  Last synced: {formatDate(lastSyncAt)}
                </Text>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="small"
                disabled={!available || syncing !== null}
                onClick={() => runSync(key)}
              >
                {syncing === key ? 'Syncing…' : 'Sync to Payload'}
              </Button>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: 'Payload',
})

export default PayloadSettingsPage
