import type { CollectionConfig } from 'payload'
import { isFromMedusa } from '../lib/access'
import { medusaProductTypeValueExists } from '../lib/medusa'

/**
 * ProductTypes – one document per Medusa product_type (e.g. serum, cleanser).
 * value comes from Medusa; CMS fields for display, hero, SEO.
 * Create/delete only from Medusa (sync); editors can only update content.
 */
export const ProductTypes: CollectionConfig = {
  slug: 'product_types',
  access: {
    read: () => true,
    create: ({ req }) => isFromMedusa(req),
    delete: ({ req }) => isFromMedusa(req),
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation }) => {
        if (operation === 'create' && data?.value != null) {
          const exists = await medusaProductTypeValueExists(String(data.value))
          if (!exists) {
            throw new Error(
              `Product type value "${data.value}" does not exist in Medusa. Only add types that exist in the commerce catalog.`,
            )
          }
        }
        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['value', 'name', 'updatedAt'],
    group: 'Product Content',
    description: 'Product type pages (e.g. Serums); value must match Medusa product_type',
  },
  fields: [
    {
      name: 'value',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Medusa product_type value (match exactly)',
        readOnly: true,
      },
    },
    {
      name: 'name',
      type: 'text',
      localized: true,
      admin: {
        description: 'Display name (from Medusa or override)',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Hero image for product type page' },
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
