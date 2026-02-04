import type { CollectionConfig } from 'payload'

/**
 * Categories – one document per Medusa product category.
 * handle comes from Medusa; CMS fields for hero, SEO, body.
 * Populate from Medusa via /api/medusa/categories then create docs with matching handle.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['handle', 'name', 'updatedAt'],
    group: 'Catalog',
    description: 'Category pages; handle must match Medusa product category',
  },
  fields: [
    {
      name: 'handle',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Medusa category handle (match exactly)',
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
