import type { CollectionConfig } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
} from '@payloadcms/plugin-seo/fields'
import { sectionBlocks } from '../fields/sectionBlocks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'path', 'pageType', '_status', 'updatedAt'],
    group: 'Content',
    description:
      'Manage site pages: homepage (path "home"), landing pages with sections, or simple content (e.g. policies). Use Live Preview to see changes while editing.',
  },
  versions: {
    drafts: {
      autosave: {
        interval: 300,
      },
    },
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          description: 'Page structure and visible content. Switch locale in the admin bar to translate.',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              localized: true,
              admin: {
                position: 'sidebar',
                description: 'Internal ID for this page (e.g. home, terms, summer-sale).',
              },
              hooks: {
                beforeValidate: [
                  ({ value, data }) => {
                    if (!value && data?.title) {
                      return (data.title as string)
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '')
                    }
                    return value
                  },
                ],
              },
            },
            {
              name: 'path',
              type: 'text',
              required: true,
              unique: true,
              localized: true,
              admin: {
                position: 'sidebar',
                description:
                  'URL path without locale. Use "home" for the front page; e.g. "policies/terms", "summer-sale".',
              },
            },
            {
              name: 'pageType',
              type: 'select',
              required: true,
              defaultValue: 'default',
              options: [
                { label: 'Default (content only)', value: 'default' },
                { label: 'Homepage (sections)', value: 'homepage' },
                { label: 'Landing (sections)', value: 'landing' },
                { label: 'Blog index (article list)', value: 'blog-index' },
              ],
              admin: {
                position: 'sidebar',
                description:
                  'Homepage = sections at "/". Landing = campaign sections. Default = rich text. Blog index = intro + all news articles (storefront).',
              },
            },
            {
              name: 'content',
              type: 'richText',
              required: false,
              localized: true,
              validate: (value, { siblingData }: { siblingData?: Record<string, unknown> }) => {
                if (siblingData?.pageType === 'default' && !value) {
                  return 'Content is required for default pages'
                }
                return true
              },
              admin: {
                condition: (_, siblingData) =>
                  siblingData?.pageType === 'default' || siblingData?.pageType === 'blog-index',
                description:
                  'Rich text body for default pages; optional intro above the article list for blog index.',
              },
            },
            {
              name: 'sections',
              type: 'blocks',
              label: 'Page Sections',
              maxRows: 10,
              localized: true,
              blocks: sectionBlocks,
              admin: {
                condition: (_, siblingData) =>
                  siblingData?.pageType === 'homepage' || siblingData?.pageType === 'landing',
                description: 'Build sections for homepage or landing pages only.',
              },
            },
          ],
        },
        {
          label: 'SEO',
          description: 'Search snippets (Google) and Open Graph. Use Generate, then edit.',
          fields: [
            {
              name: 'meta',
              type: 'group',
              label: 'SEO & sharing',
              localized: true,
              admin: {
                description:
                  'Used for **HTML `<title>`**, **meta description**, and **Open Graph** on the storefront — not shown as visible page body.',
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
