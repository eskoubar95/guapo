import type { CollectionConfig } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
} from '@payloadcms/plugin-seo/fields'

/**
 * Ingredients – database of ingredients for product content and ingredient pages.
 * Products reference these for "featured ingredients" and "avoid with".
 * Layout: Content (default) | SEO | CosIng/INCI – same structure as Categories.
 */
export const Ingredients: CollectionConfig = {
  slug: 'ingredients',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'inciName', 'updatedAt'],
    group: 'Product Content',
    description: 'Reusable ingredient database; link to products for featured/avoid-with',
  },
  fields: [
    {
      type: 'tabs',
      defaultValue: 'Content',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                  localized: true,
                  admin: {
                    width: '50%',
                    placeholder: 'e.g., Niacinamide',
                  },
                },
                {
                  name: 'slug',
                  type: 'text',
                  localized: true,
                  admin: {
                    width: '50%',
                    description: 'URL slug for ingredient page (e.g., niacinamide)',
                    placeholder: 'e.g., niacinamide',
                  },
                },
              ],
            },
            {
              name: 'summary',
              type: 'textarea',
              localized: true,
              admin: {
                description: 'Short one-liner (1–2 sentences)',
                placeholder: 'e.g., Strengthens skin barrier, controls oil, minimizes pores.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'benefit',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    width: '50%',
                    description: 'What does this ingredient do?',
                  },
                },
                {
                  name: 'concentration',
                  type: 'text',
                  localized: true,
                  admin: {
                    width: '50%',
                    placeholder: 'e.g., 2–20%',
                  },
                },
              ],
            },
            {
              name: 'alternativeNames',
              type: 'array',
              label: 'Alternative names',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                  admin: { placeholder: 'e.g., Vitamin B3' },
                },
              ],
              admin: {
                description: 'Other names (Vitamin B3, Nicotinamide, etc.)',
              },
            },
            {
              name: 'body',
              type: 'richText',
              label: 'Body content',
              localized: true,
              admin: {
                description: 'Full explanation: What is it, How it works, Side effects (use headings)',
              },
            },
            {
              name: 'avoidWith',
              type: 'array',
              label: 'Avoid combining with',
              localized: true,
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
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'meta',
              type: 'group',
              label: 'SEO',
              localized: true,
              fields: [
                MetaTitleField({ hasGenerateFn: true }),
                MetaDescriptionField({ hasGenerateFn: true }),
                MetaImageField({ relationTo: 'media', hasGenerateFn: true }),
                OverviewField({
                  titlePath: 'meta.title',
                  descriptionPath: 'meta.description',
                  imagePath: 'meta.image',
                }),
              ],
            },
          ],
        },
        {
          label: 'CosIng/INCI',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'inciName',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'INCI standard name (e.g., NIACINAMIDE)',
                    placeholder: 'e.g., NIACINAMIDE',
                  },
                },
                {
                  name: 'cosingId',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'CosIng ID from EU database',
                    placeholder: 'e.g., 35499',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'ecNumber',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'EC number',
                    placeholder: 'e.g., 202-713-4',
                  },
                },
                {
                  name: 'innName',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'International Nonproprietary Name',
                    placeholder: 'e.g., nicotinamide',
                  },
                },
              ],
            },
            {
              name: 'phEurName',
              type: 'text',
              admin: {
                description: 'Ph. Eur. name (optional)',
                placeholder: 'e.g., nicotinamidum',
              },
            },
          ],
        },
      ],
    },
  ],
}
