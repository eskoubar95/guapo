import type { CollectionConfig } from 'payload'

/**
 * Beneficials – databaserede værdier for "godt til" (skin types, concerns).
 * Products have many-to-many relationship; no hardcoded select lists.
 */
export const Beneficials: CollectionConfig = {
  slug: 'beneficials',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'type', 'updatedAt'],
    group: 'Product Content',
    description: 'Skin types and concerns; link to products for "good for"',
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Skin type', value: 'skin_type' },
        { label: 'Concern', value: 'concern' },
      ],
      admin: {
        description: 'Category of beneficial',
      },
    },
    {
      name: 'value',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Stable value (e.g. dry, oily, acne)',
        placeholder: 'e.g., dry',
      },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: {
        description: 'Display label (e.g. Dry skin)',
        placeholder: 'e.g., Dry skin',
      },
    },
  ],
}
