import type { CollectionConfig } from 'payload'
import { medusaCategoryHandleExists } from '../lib/medusa'

/** Allow create/delete only when request is from Medusa sync (same as Products). */
function isFromMedusa(req: { query?: Record<string, unknown>; headers?: { get?: (name: string) => string | null } }): boolean {
  const q = req?.query?.is_from_medusa
  if (q === true || q === 'true') return true
  const secret = process.env.PAYLOAD_MEDUSA_SYNC_SECRET
  if (secret && req?.headers?.get?.('x-medusa-sync-secret') === secret) return true
  return false
}

/**
 * Categories – one document per Medusa product category.
 * handle comes from Medusa; CMS fields for hero, SEO, body.
 * Create/delete only from Medusa (sync); editors can only update content.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    read: () => true,
    create: ({ req }) => isFromMedusa(req),
    delete: ({ req }) => isFromMedusa(req),
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        // Skip validation when create is from Medusa sync (we already have valid data from Commerce).
        if (operation === 'create' && data?.handle != null && !isFromMedusa(req)) {
          const exists = await medusaCategoryHandleExists(String(data.handle))
          if (!exists) {
            throw new Error(
              `Category handle "${data.handle}" does not exist in Medusa. Only add categories that exist in the commerce catalog.`,
            )
          }
        }
        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['handle', 'name', 'parent', 'updatedAt'],
    group: 'Catalog',
    description: 'Category pages; handle must match Medusa product category',
  },
  fields: [
    {
      name: 'medusa_id',
      type: 'text',
      admin: {
        description: 'Medusa product_category ID (set by Medusa sync for delete-by-id)',
        readOnly: true,
        hidden: true,
      },
    },
    {
      name: 'handle',
      type: 'text',
      required: true,
      unique: true,
      validate: (val) => {
        if (typeof val !== 'string' || val.length === 0) return 'Handle is required.'
        if (!/^[a-z0-9-]+$/.test(val)) return 'Handle must be lowercase letters, numbers and hyphens only.'
        if (val.length > 100) return 'Handle must be 100 characters or less.'
        return true
      },
      admin: {
        description: 'Medusa category handle (match exactly)',
        readOnly: true,
      },
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Display name (from Medusa or override)',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
      admin: {
        description: 'Parent category (Medusa hierarchy; set by sync)',
        readOnly: true,
      },
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description: 'URL slug override (defaults to handle)',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Hero image for category page' },
    },
    {
      name: 'meta',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Body content',
    },
  ],
}
