import type { CollectionConfig } from 'payload'

/**
 * Skin types – e.g. dry, oily, combination, normal, sensitive.
 * Products link to these for "Fit & benefits".
 */
export const SkinTypes: CollectionConfig = {
  slug: 'skin-types',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['value', 'label', 'updatedAt'],
    group: 'Product Content',
    description: 'Skin types for product fit (dry, oily, combination, etc.)',
  },
  fields: [
    {
      name: 'value',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Stable value (e.g. dry, oily)',
        placeholder: 'e.g., dry',
      },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Display label (e.g. Dry skin)',
        placeholder: 'e.g., Dry skin',
      },
    },
  ],
}
