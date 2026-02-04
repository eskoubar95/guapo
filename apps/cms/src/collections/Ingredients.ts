import type { CollectionConfig } from 'payload'

/**
 * Ingredients – database of ingredients for product content.
 * Products reference these for "featured ingredients" and "avoid with".
 */
export const Ingredients: CollectionConfig = {
  slug: 'ingredients',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
    group: 'Product Content',
    description: 'Reusable ingredient database; link to products for featured/avoid-with',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'e.g., Vitamin C (Ascorbic Acid)',
      },
    },
    {
      name: 'benefit',
      type: 'textarea',
      admin: {
        description: 'What does this ingredient do?',
      },
    },
    {
      name: 'concentration',
      type: 'text',
      admin: {
        placeholder: 'e.g., 15%',
      },
    },
    {
      name: 'avoidWith',
      type: 'array',
      label: 'Avoid combining with',
      fields: [
        {
          name: 'ingredient',
          type: 'relationship',
          relationTo: 'ingredients',
          required: true,
        },
        {
          name: 'reason',
          type: 'text',
        },
      ],
      admin: {
        description: 'Ingredients that should not be used with this one',
      },
    },
  ],
}
