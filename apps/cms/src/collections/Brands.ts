import type { CollectionConfig } from 'payload'

/**
 * Brands – one document per brand (Medusa product.metadata.brand).
 * brandKey comes from Medusa; CMS fields for display, logo, SEO.
 */
export const Brands: CollectionConfig = {
  slug: 'brands',
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['brandKey', 'displayName', 'updatedAt'],
    group: 'Catalog',
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
      },
    },
    {
      name: 'displayName',
      type: 'text',
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
