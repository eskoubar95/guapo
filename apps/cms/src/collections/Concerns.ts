import type { CollectionConfig } from 'payload'

/**
 * Concerns – e.g. acne, dryness, pores, anti-age.
 * Products link to these for "Fit & benefits".
 */
export const Concerns: CollectionConfig = {
  slug: 'concerns',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['value', 'label', 'updatedAt'],
    group: 'Product Content',
    description: 'Skin concerns for product benefits (acne, dryness, etc.)',
  },
  fields: [
    {
      name: 'value',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Stable value (e.g. acne, dryness)',
        placeholder: 'e.g., acne',
      },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Display label (e.g. Acne)',
        placeholder: 'e.g., Acne',
      },
    },
  ],
}
