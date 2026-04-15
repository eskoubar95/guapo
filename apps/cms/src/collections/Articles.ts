import type { CollectionConfig } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
} from '@payloadcms/plugin-seo/fields'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    group: 'Content',
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
          description: 'Article body and listing fields. Switch locale in the admin bar to translate.',
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
              },
              hooks: {
                beforeValidate: [
                  ({ value, data }) => {
                    if (!value && data?.title) {
                      return data.title
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
              name: 'status',
              type: 'select',
              defaultValue: 'draft',
              options: [
                { label: 'Draft', value: 'draft' },
                { label: 'In Review', value: 'review' },
                { label: 'Published', value: 'published' },
              ],
              admin: {
                position: 'sidebar',
              },
            },
            {
              name: 'category',
              type: 'select',
              required: true,
              options: [
                { label: 'Skincare Tips', value: 'skincare-tips' },
                { label: 'Product Guides', value: 'product-guides' },
                { label: 'Ingredient Spotlight', value: 'ingredients' },
                { label: 'Routine Advice', value: 'routines' },
                { label: 'News & Updates', value: 'news' },
              ],
              admin: {
                position: 'sidebar',
              },
            },
            {
              name: 'featuredImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              maxLength: 300,
              localized: true,
              admin: {
                description: 'Brief summary for listings and SEO',
              },
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
              localized: true,
            },
            {
              name: 'author',
              type: 'relationship',
              relationTo: 'users',
              admin: {
                position: 'sidebar',
              },
            },
            {
              name: 'publishedAt',
              type: 'date',
              admin: {
                position: 'sidebar',
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
            {
              name: 'tags',
              type: 'array',
              fields: [
                {
                  name: 'tag',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          description: 'Search snippets and social sharing. Use Generate, then edit.',
          fields: [
            {
              name: 'meta',
              type: 'group',
              label: 'SEO & sharing',
              localized: true,
              admin: {
                description:
                  'Overrides listing snippet for **Google** and **Open Graph** when set. Leave image empty to use the featured image.',
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
