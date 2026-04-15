import type { CollectionConfig } from 'payload'

/**
 * Concerns – e.g. acne, dryness, pores, anti-age.
 * Products link to these for "Fit & benefits".
 */
export const Concerns: CollectionConfig = {
  slug: 'concerns',
  access: {
    /** Storefront concern PLP metadata reads label + optional meta via /api/storefront/concern/[value] */
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
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
    {
      name: 'meta',
      type: 'group',
      localized: true,
      label: 'Concern listing SEO',
      admin: {
        description:
          'Metadata for /{locale}/concerns/{value}. Leave title empty to use the storefront default pattern.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'Full document title (<title>) for this concern listing page.',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Optional meta description.',
          },
        },
      ],
    },
  ],
}
