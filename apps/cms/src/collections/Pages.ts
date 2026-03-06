import type { Block, CollectionConfig } from 'payload'
import { sectionBlocks } from '../fields/sectionBlocks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'path', 'pageType', '_status', 'updatedAt'],
    group: 'Content',
    description: 'Manage site pages: homepage (path "home"), landing pages with sections, or simple content (e.g. policies). Use Live Preview to see changes while editing.',
  },
  versions: {
    drafts: {
      autosave: {
        interval: 300, // 5 minutes
      },
    },
  },
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
        description: 'URL path without locale. Use "home" for the front page; e.g. "policies/terms", "summer-sale".',
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
      ],
      admin: {
        position: 'sidebar',
        description: 'Homepage = sections shown at "/". Landing = sections (e.g. campaign). Default = rich text only.',
      },
    },
    {
      name: 'meta',
      type: 'group',
      localized: true,
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'SEO title (defaults to page title if empty)',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'SEO meta description',
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Social sharing image',
          },
        },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      required: false,
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.pageType === 'default',
        description: 'Required for default (content) pages, e.g. terms, privacy.',
      },
    },
    {
      name: 'sections',
      type: 'blocks',
      label: 'Page Sections',
      maxRows: 10,
      localized: true,
      blocks: sectionBlocks as Block[],
      admin: {
        condition: (_, siblingData) =>
          siblingData?.pageType === 'homepage' || siblingData?.pageType === 'landing',
        description: 'Build sections for homepage or landing pages. Reorder and add blocks.',
      },
    },
  ],
}
