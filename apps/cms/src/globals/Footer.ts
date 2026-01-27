import type { GlobalConfig } from 'payload'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    group: 'Site Settings',
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: 'Link Columns',
      maxRows: 4,
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'links',
          type: 'array',
          maxRows: 8,
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
            },
            {
              name: 'type',
              type: 'radio',
              defaultValue: 'internal',
              options: [
                { label: 'Internal Page', value: 'internal' },
                { label: 'External URL', value: 'external' },
              ],
            },
            {
              name: 'page',
              type: 'relationship',
              relationTo: 'pages',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'internal',
              },
            },
            {
              name: 'url',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'external',
              },
            },
            {
              name: 'newTab',
              type: 'checkbox',
              label: 'Open in new tab',
            },
          ],
        },
      ],
    },
    {
      name: 'legalLinks',
      type: 'array',
      label: 'Legal/Policy Links',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Media Links',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'X (Twitter)', value: 'twitter' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'newsletter',
      type: 'group',
      label: 'Newsletter Section',
      fields: [
        {
          name: 'show',
          type: 'checkbox',
          label: 'Show newsletter signup',
          defaultValue: true,
        },
        {
          name: 'title',
          type: 'text',
          defaultValue: 'Stay Updated',
          admin: {
            condition: (_, siblingData) => siblingData?.show,
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            condition: (_, siblingData) => siblingData?.show,
          },
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      defaultValue: '© {year} Guapo. All rights reserved.',
      admin: {
        description: 'Use {year} to auto-insert current year',
      },
    },
  ],
}
