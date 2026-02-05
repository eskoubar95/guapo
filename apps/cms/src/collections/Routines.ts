import type { CollectionConfig } from 'payload'

/**
 * Routines – structured routine data (AM/PM/Both).
 * Products can link to routines or have routine-specific notes.
 */
export const Routines: CollectionConfig = {
  slug: 'routines',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'order', 'updatedAt'],
    group: 'Product Content',
    description: 'Routine definitions (AM/PM/Both); link to products',
  },
  fields: [
    {
      name: 'name',
      type: 'select',
      required: true,
      options: [
        { label: 'Morning (AM)', value: 'am' },
        { label: 'Evening (PM)', value: 'pm' },
        { label: 'Both AM & PM', value: 'both' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        description: 'Suggested order in routine (1 = first)',
      },
    },
    {
      name: 'steps',
      type: 'array',
      label: 'Steps',
      localized: true,
      fields: [
        {
          name: 'step',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
