import type { CollectionConfig } from 'payload'
import { isFromMedusa } from '../lib/access'
import { medusaBrandKeyExists } from '../lib/medusa'

/**
 * Brands – one document per brand (Medusa product.metadata.brand).
 * brandKey comes from Medusa; CMS fields for display, logo, SEO.
 * Create/delete only from Medusa (sync); editors can only update content.
 */
export const Brands: CollectionConfig = {
  slug: 'brands',
  access: {
    read: () => true,
    create: ({ req }) => isFromMedusa(req),
    delete: ({ req }) => isFromMedusa(req),
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, originalDoc }) => {
        const brandKeyChanged =
          data?.brandKey != null &&
          (operation === 'create' || data.brandKey !== originalDoc?.brandKey)
        if (brandKeyChanged) {
          const exists = await medusaBrandKeyExists(String(data.brandKey))
          if (!exists) {
            throw new Error(
              `Brand key "${data.brandKey}" does not exist in Medusa. Only add brands that exist in the commerce catalog (product.metadata.brand).`,
            )
          }
        }
        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['brandKey', 'displayName', 'updatedAt'],
    group: 'Product Content',
    description: 'Brand pages; brandKey must match Medusa metadata.brand',
  },
  fields: [
    {
      name: 'brandKey',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Medusa product.metadata.brand value',
        readOnly: true,
      },
    },
    {
      name: 'displayName',
      type: 'text',
      localized: true,
      admin: {
        description: 'Display name for UI',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'meta',
      type: 'group',
      label: 'SEO',
      localized: true,
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
    {
      name: 'body',
      type: 'richText',
      label: 'Body content',
      localized: true,
    },
  ],
}
