import type { CollectionConfig } from 'payload'

/**
 * Products – Medusa products with CMS content mapped on.
 * Handle (and optionally title) come from Medusa; rest is CMS-only.
 * Populate via "Add from Medusa" flow or sync; do not create by hand without handle.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['handle', 'title', 'updatedAt'],
    group: 'Product Content',
    description: 'Product content keyed by Medusa handle; add from Medusa then edit',
  },
  fields: [
    {
      name: 'handle',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Medusa product handle (must match exactly)',
        readOnly: true,
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Product title (synced from Medusa or override)',
      },
    },
    {
      name: 'featuredIngredients',
      type: 'relationship',
      relationTo: 'ingredients',
      hasMany: true,
      admin: {
        description: 'Highlighted ingredients for this product',
      },
    },
    {
      name: 'avoidWithIngredients',
      type: 'relationship',
      relationTo: 'ingredients',
      hasMany: true,
      admin: {
        description: 'Ingredients to avoid combining with this product',
      },
    },
    {
      name: 'beneficials',
      type: 'relationship',
      relationTo: 'beneficials',
      hasMany: true,
      admin: {
        description: 'Skin types / concerns this product is good for',
      },
    },
    {
      name: 'routines',
      type: 'relationship',
      relationTo: 'routines',
      hasMany: true,
      admin: {
        description: 'Routines this product fits into',
      },
    },
    {
      name: 'howTo',
      type: 'group',
      label: 'How to Use',
      fields: [
        {
          name: 'steps',
          type: 'array',
          label: 'Application Steps',
          fields: [
            { name: 'step', type: 'text', required: true },
            { name: 'tip', type: 'text' },
          ],
        },
        { name: 'amount', type: 'text', admin: { placeholder: 'e.g., 2-3 drops' } },
        { name: 'frequency', type: 'text', admin: { placeholder: 'e.g., Once daily' } },
        { name: 'tips', type: 'richText', label: 'Additional Tips' },
      ],
    },
    {
      name: 'routineTime',
      type: 'group',
      label: 'AM/PM Routine',
      fields: [
        {
          name: 'time',
          type: 'select',
          options: [
            { label: 'Morning (AM)', value: 'am' },
            { label: 'Evening (PM)', value: 'pm' },
            { label: 'Both AM & PM', value: 'both' },
            { label: 'Either', value: 'either' },
          ],
        },
        { name: 'order', type: 'number' },
        { name: 'amNotes', type: 'textarea', label: 'AM Notes' },
        { name: 'pmNotes', type: 'textarea', label: 'PM Notes' },
        { name: 'sunscreenRequired', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'pairWithRecommended',
      type: 'array',
      label: 'Recommended to pair with',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        { name: 'reason', type: 'text' },
        {
          name: 'order',
          type: 'select',
          options: [
            { label: 'Before', value: 'before' },
            { label: 'After', value: 'after' },
            { label: 'Alternate days', value: 'alternate' },
          ],
        },
      ],
    },
    {
      name: 'pairWithAvoid',
      type: 'array',
      label: 'Avoid using with',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        { name: 'reason', type: 'text' },
      ],
    },
    {
      name: 'precautions',
      type: 'group',
      label: 'Precautions',
      fields: [
        { name: 'patchTest', type: 'checkbox', defaultValue: false, label: 'Recommend patch test' },
        {
          name: 'pregnancySafe',
          type: 'select',
          options: [
            { label: 'Safe', value: 'safe' },
            { label: 'Consult doctor', value: 'consult' },
            { label: 'Avoid', value: 'avoid' },
            { label: 'Unknown', value: 'unknown' },
          ],
        },
        {
          name: 'warnings',
          type: 'array',
          fields: [{ name: 'warning', type: 'text', required: true }],
        },
      ],
    },
  ],
}
