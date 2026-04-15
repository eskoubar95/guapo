import type { CollectionConfig } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
} from '@payloadcms/plugin-seo/fields'
import { isFromMedusa } from '../lib/access'
import { medusaProductHandleExists } from '../lib/medusa'

/**
 * Products – Medusa products with CMS content mapped on.
 * Create/delete only from Medusa; editors can only update content.
 * SEO: @payloadcms/plugin-seo fields (meta title, description, OG image) — storefront PDP metadata.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  /** Avoid lock-check DB query on update; products are often updated from Medusa (sync, parse & link) with no admin user. */
  lockDocuments: false,
  access: {
    read: () => true,
    create: ({ req }) => isFromMedusa(req),
    update: ({ req }) => isFromMedusa(req) || !!req.user,
    delete: ({ req }) => isFromMedusa(req),
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation }) => {
        if (operation === 'create' && data?.handle != null) {
          const exists = await medusaProductHandleExists(String(data.handle))
          if (!exists) {
            throw new Error(
              `Product handle "${data.handle}" does not exist in Medusa. Only add products that exist in the commerce catalog (use handle from Medusa).`,
            )
          }
        }
        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['handle', 'title', 'updatedAt'],
    group: 'Product Content',
    description:
      'Product content keyed by Medusa handle. Sync creates the row from Medusa; edit **per locale** (DA/EN): title, description, ingredients, and **SEO** for the PDP.',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'medusa_id',
              type: 'text',
              unique: true,
              admin: {
                description: 'Medusa product ID (set by Medusa sync for delete-by-id)',
                readOnly: true,
                hidden: true,
              },
            },
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
              localized: true,
              admin: {
                description: 'Product title (synced from Medusa or override)',
              },
            },
            {
              name: 'description',
              type: 'richText',
              localized: true,
              admin: {
                description: 'Product description',
              },
            },
            {
              name: 'subtitle',
              type: 'textarea',
              label: 'Subtitle',
              localized: true,
              admin: {
                description: 'Short product subtitle (synced from Medusa or editor override)',
              },
            },
          ],
        },
        {
          label: 'Ingredients',
          fields: [
            {
              name: 'keyIngredients',
              type: 'relationship',
              relationTo: 'ingredients',
              hasMany: true,
              admin: {
                description: 'Few highlighted ingredients',
              },
            },
            {
              name: 'ingredients',
              type: 'relationship',
              relationTo: 'ingredients',
              hasMany: true,
              label: 'Full ingredient list (INCI)',
              admin: {
                description: 'Complete list from packaging/PIF (select from Ingredients)',
              },
            },
          ],
        },
        {
          label: 'Fit & benefits',
          fields: [
            {
              name: 'skinTypes',
              type: 'relationship',
              relationTo: 'skin-types',
              hasMany: true,
              admin: {
                description: 'Which skin types is it suitable for?',
              },
            },
            {
              name: 'concerns',
              type: 'relationship',
              relationTo: 'concerns',
              hasMany: true,
              admin: {
                description: 'What can it help with?',
              },
            },
          ],
        },
        {
          label: 'Specifications',
          fields: [
            {
              name: 'specifications',
              type: 'group',
              label: 'Specifications',
              admin: {
                description: 'SKU and EAN are synced from Medusa (read-only). Other fields can be edited.',
              },
              fields: [
                {
                  name: 'brand',
                  type: 'relationship',
                  relationTo: 'brands',
                  hasMany: false,
                  admin: {
                    description: 'Brand (matches Medusa metadata.brand via brandKey)',
                  },
                },
                {
                  name: 'volume',
                  type: 'text',
                  admin: {
                    placeholder: 'e.g., 50 ml',
                  },
                },
                {
                  name: 'sku',
                  type: 'text',
                  label: 'SKU / item number',
                  admin: {
                    description: 'Synced from Medusa variant – do not edit',
                    readOnly: true,
                  },
                },
                {
                  name: 'ean',
                  type: 'text',
                  label: 'EAN',
                  admin: {
                    description: 'Synced from Medusa variant – do not edit',
                    readOnly: true,
                  },
                },
                {
                  name: 'manufacturer',
                  type: 'text',
                  label: 'Manufacturer',
                },
                {
                  name: 'manufacturerContact',
                  type: 'text',
                  label: 'Manufacturer contact',
                },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          description: 'Search snippets (Google) and Open Graph (social / iMessage). Use Generate, then edit.',
          fields: [
            {
              name: 'meta',
              type: 'group',
              label: 'SEO & sharing',
              localized: true,
              admin: {
                description:
                  'Used for **HTML `<title>`**, **meta description**, and **Open Graph** on the product page — **not** the long description in the Description tab.',
              },
              fields: [
                MetaTitleField({ hasGenerateFn: true }),
                MetaDescriptionField({ hasGenerateFn: true }),
                MetaImageField({
                  relationTo: 'media',
                  hasGenerateFn: true,
                }),
                OverviewField({
                  titlePath: 'meta.title',
                  descriptionPath: 'meta.description',
                  imagePath: 'meta.image',
                }),
              ],
            },
          ],
        },
      ],
    },
  ],
}
