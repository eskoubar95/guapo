import type { CollectionConfig } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
} from '@payloadcms/plugin-seo/fields'
import { isFromMedusa } from '../lib/access'
import { medusaCategoryHandleExists } from '../lib/medusa'

/**
 * Categories – one document per Medusa product category (sync creates the row; editors own content).
 * Storefront URL: /{locale}/categories/{handle} — handle comes from Medusa (Medusa tab) and must not be edited to match routing.
 * SEO: official @payloadcms/plugin-seo fields (meta title, description, OG image) + optional intro body (Lexical).
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  access: {
    read: () => true,
    create: ({ req }) => isFromMedusa(req),
    update: ({ req }) => isFromMedusa(req) || !!req.user,
    delete: ({ req }) => isFromMedusa(req),
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        // Skip validation when create is from Medusa sync (we already have valid data from Commerce).
        // When Medusa returns empty list (unavailable), medusaCategoryHandleExists fails open to avoid blocking CMS.
        if (operation === 'create' && data?.handle != null && !isFromMedusa(req)) {
          const exists = await medusaCategoryHandleExists(String(data.handle))
          if (!exists) {
            throw new Error(
              `Category handle "${data.handle}" does not exist in Medusa. Only add categories that exist in the commerce catalog.`,
            )
          }
        }
        return data
      },
    ],
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['medusa_id', 'handle', 'name', 'parent', 'updatedAt'],
    group: 'Product Content',
    description:
      'Each row mirrors a Medusa product category. Run **Settings → Payload CMS sync → Categories** in Medusa Admin to create missing documents. Then edit **per locale** (DA/EN): display name, intro body, and SEO. Re-sync updates handle/parent only — it does not overwrite your copy.',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          description:
            'What customers see on the category page (H1, intro). Switch locale in the admin bar to translate.',
          fields: [
            {
              name: 'name',
              type: 'text',
              localized: true,
              admin: {
                description:
                  'Shown as the main heading (H1) on the storefront category page. Override Medusa’s default name per language — e.g. Danish “Ansigtsmasker” while the URL handle stays `face-masks`.',
              },
            },
            {
              name: 'body',
              type: 'richText',
              label: 'Intro (category page)',
              localized: true,
              admin: {
                description:
                  'Optional editorial intro above the product grid: who it’s for, how to choose, links to guides. Helps SEO and AI summaries; keep it substantive, not keyword stuffing.',
              },
            },
            {
              name: 'parent',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: false,
              admin: {
                description: 'Hierarchy from Medusa; updated by sync. Read-only.',
                readOnly: true,
              },
            },
            {
              name: 'slug',
              type: 'text',
              localized: true,
              admin: {
                description:
                  'Reserved for a future localized URL scheme. The live storefront still uses **Medusa handle** in the path (`/da/categories/{handle}`). Safe to leave empty.',
              },
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
                  '**Meta title** and **Meta description** power Google results; **Meta image** is the OG image for shares. Fields are per locale — switch locale in the admin bar.',
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
          description: 'Commerce identifiers — synced from Medusa; do not change handle without updating Medusa.',
          fields: [
            {
              name: 'medusa_id',
              type: 'text',
              admin: {
                description: 'Medusa `product_category` id — used by sync for updates and deletes.',
                readOnly: true,
              },
            },
            {
              name: 'handle',
              type: 'text',
              required: true,
              unique: true,
              validate: (val: unknown) => {
                if (typeof val !== 'string' || val.length === 0) return 'Handle is required.'
                if (!/^[a-z0-9-]+$/.test(val)) return 'Handle must be lowercase letters, numbers and hyphens only.'
                if (val.length > 100) return 'Handle must be 100 characters or less.'
                return true
              },
              admin: {
                description:
                  'Canonical URL segment on the storefront: `/{locale}/categories/{handle}`. Must match Medusa; updated by sync.',
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
}
