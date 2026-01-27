import type { CollectionConfig } from 'payload'

/**
 * Product Guidance Collection
 *
 * Stores skincare guidance content that is linked to products in Medusa.
 * Each guidance entry is keyed by a product SKU/handle for easy lookup.
 *
 * This data is displayed on Product Detail Pages (PDP) to help customers
 * understand how to use products and what skin concerns they address.
 */
export const ProductGuidance: CollectionConfig = {
  slug: 'product-guidance',
  admin: {
    useAsTitle: 'productIdentifier',
    defaultColumns: ['productIdentifier', 'skinTypes', 'updatedAt'],
    group: 'Product Content',
    description: 'Skincare guidance for products (linked to Medusa products)',
  },
  fields: [
    {
      name: 'productIdentifier',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Medusa product handle or SKU (must match exactly)',
        placeholder: 'e.g., vitamin-c-serum-30ml',
      },
    },

    // Skin Types
    {
      name: 'skinTypes',
      type: 'group',
      label: 'Skin Type Compatibility',
      fields: [
        {
          name: 'suitable',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Normal', value: 'normal' },
            { label: 'Dry', value: 'dry' },
            { label: 'Oily', value: 'oily' },
            { label: 'Combination', value: 'combination' },
            { label: 'Sensitive', value: 'sensitive' },
            { label: 'All Skin Types', value: 'all' },
          ],
          admin: {
            description: 'Which skin types is this product suitable for?',
          },
        },
        {
          name: 'notes',
          type: 'textarea',
          admin: {
            description: 'Additional notes about skin type suitability',
          },
        },
      ],
    },

    // Skin Concerns
    {
      name: 'concerns',
      type: 'group',
      label: 'Skin Concerns Addressed',
      fields: [
        {
          name: 'primary',
          type: 'select',
          hasMany: true,
          options: [
            { label: 'Acne & Breakouts', value: 'acne' },
            { label: 'Aging & Wrinkles', value: 'aging' },
            { label: 'Dark Spots & Hyperpigmentation', value: 'dark-spots' },
            { label: 'Dryness & Dehydration', value: 'dryness' },
            { label: 'Dullness', value: 'dullness' },
            { label: 'Enlarged Pores', value: 'pores' },
            { label: 'Oiliness', value: 'oiliness' },
            { label: 'Redness & Irritation', value: 'redness' },
            { label: 'Sensitivity', value: 'sensitivity' },
            { label: 'Sun Damage', value: 'sun-damage' },
            { label: 'Texture & Roughness', value: 'texture' },
            { label: 'Under-eye Concerns', value: 'under-eye' },
          ],
          admin: {
            description: 'Primary skin concerns this product addresses',
          },
        },
        {
          name: 'description',
          type: 'richText',
          admin: {
            description: 'Detailed explanation of how it helps with these concerns',
          },
        },
      ],
    },

    // Key Ingredients
    {
      name: 'ingredients',
      type: 'group',
      label: 'Key Ingredients',
      fields: [
        {
          name: 'highlighted',
          type: 'array',
          label: 'Featured Ingredients',
          maxRows: 6,
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
              name: 'concentration',
              type: 'text',
              admin: {
                placeholder: 'e.g., 15%',
              },
            },
            {
              name: 'benefit',
              type: 'textarea',
              admin: {
                description: 'What does this ingredient do?',
              },
            },
          ],
        },
        {
          name: 'avoidWith',
          type: 'array',
          label: 'Ingredients to Avoid Combining',
          fields: [
            {
              name: 'ingredient',
              type: 'text',
              required: true,
            },
            {
              name: 'reason',
              type: 'text',
            },
          ],
          admin: {
            description: 'Ingredients that should not be used with this product',
          },
        },
      ],
    },

    // How-to Guide
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
            {
              name: 'step',
              type: 'text',
              required: true,
            },
            {
              name: 'tip',
              type: 'text',
              admin: {
                description: 'Optional pro tip for this step',
              },
            },
          ],
        },
        {
          name: 'amount',
          type: 'text',
          admin: {
            placeholder: 'e.g., 2-3 drops, pea-sized amount',
            description: 'Recommended amount per application',
          },
        },
        {
          name: 'frequency',
          type: 'text',
          admin: {
            placeholder: 'e.g., Once daily, Twice daily',
            description: 'How often to use',
          },
        },
        {
          name: 'tips',
          type: 'richText',
          label: 'Additional Tips',
        },
      ],
    },

    // AM/PM Routine Guidance
    {
      name: 'routineTime',
      type: 'group',
      label: 'AM/PM Routine',
      fields: [
        {
          name: 'time',
          type: 'select',
          options: [
            { label: 'Morning Only (AM)', value: 'am' },
            { label: 'Evening Only (PM)', value: 'pm' },
            { label: 'Both AM & PM', value: 'both' },
            { label: 'Either AM or PM', value: 'either' },
          ],
          admin: {
            description: 'When should this product be used in a skincare routine?',
          },
        },
        {
          name: 'order',
          type: 'number',
          admin: {
            description: 'Suggested order in routine (1 = first, higher = later)',
          },
        },
        {
          name: 'amNotes',
          type: 'textarea',
          label: 'AM Routine Notes',
          admin: {
            description: 'Specific guidance for morning use',
            condition: (_, siblingData) =>
              siblingData?.time === 'am' ||
              siblingData?.time === 'both' ||
              siblingData?.time === 'either',
          },
        },
        {
          name: 'pmNotes',
          type: 'textarea',
          label: 'PM Routine Notes',
          admin: {
            description: 'Specific guidance for evening use',
            condition: (_, siblingData) =>
              siblingData?.time === 'pm' ||
              siblingData?.time === 'both' ||
              siblingData?.time === 'either',
          },
        },
        {
          name: 'sunscreenRequired',
          type: 'checkbox',
          label: 'Requires sunscreen follow-up',
          defaultValue: false,
          admin: {
            description: 'Check if product increases sun sensitivity',
          },
        },
      ],
    },

    // Pair-with Recommendations
    {
      name: 'pairWith',
      type: 'group',
      label: 'Product Pairings',
      fields: [
        {
          name: 'recommended',
          type: 'array',
          label: 'Recommended to Pair With',
          fields: [
            {
              name: 'productIdentifier',
              type: 'text',
              required: true,
              admin: {
                description: 'Medusa product handle/SKU of recommended product',
              },
            },
            {
              name: 'reason',
              type: 'text',
              admin: {
                description: 'Why these products work well together',
              },
            },
            {
              name: 'order',
              type: 'select',
              options: [
                { label: 'Use before this product', value: 'before' },
                { label: 'Use after this product', value: 'after' },
                { label: 'Alternate days', value: 'alternate' },
              ],
            },
          ],
        },
        {
          name: 'avoid',
          type: 'array',
          label: 'Products to Avoid Using Together',
          fields: [
            {
              name: 'productIdentifier',
              type: 'text',
              required: true,
            },
            {
              name: 'reason',
              type: 'text',
            },
          ],
        },
        {
          name: 'routineSuggestion',
          type: 'richText',
          label: 'Full Routine Suggestion',
          admin: {
            description: 'Suggested complete routine including this product',
          },
        },
      ],
    },

    // Warnings & Precautions
    {
      name: 'precautions',
      type: 'group',
      label: 'Precautions & Warnings',
      fields: [
        {
          name: 'patchTest',
          type: 'checkbox',
          label: 'Recommend patch test',
          defaultValue: false,
        },
        {
          name: 'pregnancySafe',
          type: 'select',
          options: [
            { label: 'Safe during pregnancy', value: 'safe' },
            { label: 'Consult doctor', value: 'consult' },
            { label: 'Not recommended', value: 'avoid' },
            { label: 'Unknown / Not specified', value: 'unknown' },
          ],
        },
        {
          name: 'warnings',
          type: 'array',
          fields: [
            {
              name: 'warning',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
