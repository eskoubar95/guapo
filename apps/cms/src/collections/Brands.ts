import type { CollectionConfig } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
} from '@payloadcms/plugin-seo/fields'
import { isFromMedusa } from '../lib/access'
import { medusaBrandKeyExists } from '../lib/medusa'

/**
 * Brands – one document per Medusa brand (sync creates the row; editors own content).
 * Storefront URL: /{locale}/brands/{handle} — `brandKey` matches Medusa brand handle.
 */
export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: {
    singular: 'Brand',
    plural: 'Brands',
  },
  access: {
    read: () => true,
    create: ({ req }) => isFromMedusa(req),
    update: ({ req }) => isFromMedusa(req) || !!req.user,
    delete: ({ req }) => isFromMedusa(req),
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, originalDoc }) => {
        const brandKeyChanged =
          data?.brandKey != null &&
          (operation === 'create' || data.brandKey !== originalDoc?.brandKey)
        if (brandKeyChanged) {
          const exists = await medusaBrandKeyExists(String(data.brandKey))
          if (!exists) {
            throw new Error(
              `Brand key "${data.brandKey}" does not exist in Medusa. Only add brands that exist in the commerce catalog (product.metadata.brand).`,
            )
          }
        }
        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'displayName',
    defaultColumns: ['brandKey', 'medusa_id', 'displayName', 'updatedAt'],
    group: 'Product Content',
    description:
      'Each row mirrors a Medusa brand. Run **Settings → Payload CMS sync → Brands** in Medusa Admin to create missing documents. Then edit **per locale** (DA/EN): display name, body, SEO. Re-sync can set **medusa_id** for storefront joins.',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          description: 'Display name and editorial body below the product grid on the brand PLP.',
          fields: [
            {
              name: 'displayName',
              type: 'text',
              localized: true,
              admin: {
                description: 'Shown as H1 on `/brands/{handle}` — override Medusa name per locale.',
              },
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Optional logo (future hero use on PLP).',
              },
            },
            {
              name: 'body',
              type: 'richText',
              label: 'Brand page body',
              localized: true,
              admin: {
                description:
                  'Rich text **below the product grid** only. Meta title/description are for `<head>` / OG — not shown as duplicate body text.',
              },
            },
          ],
        },
        {
          label: 'SEO',
          description: 'Search snippets and Open Graph — not rendered as visible PLP copy.',
          fields: [
            {
              name: 'meta',
              type: 'group',
              label: 'SEO & sharing',
              localized: true,
              admin: {
                description:
                  'Used for **HTML `<title>`**, **meta description**, and **Open Graph** on the storefront.',
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
        {
          label: 'Medusa',
          description: 'Identifiers from commerce sync — do not edit `brandKey` without updating Medusa.',
          fields: [
            {
              name: 'medusa_id',
              type: 'text',
              admin: {
                description: 'Medusa brand `id` — used by storefront API to join Payload when needed.',
                readOnly: true,
              },
            },
            {
              name: 'brandKey',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                description: 'Must equal Medusa brand **handle** (URL segment `/brands/{brandKey}`).',
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
}
