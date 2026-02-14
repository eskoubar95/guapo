import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Site Navigation',
  admin: {
    group: 'Site Settings',
  },
  fields: [
    {
      name: 'mainMenu',
      type: 'array',
      label: 'Main Menu',
      maxRows: 8,
      localized: true,
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'link',
          options: [
            { label: 'Link', value: 'link' },
            { label: 'Dropdown', value: 'dropdown' },
          ],
        },
        {
          name: 'link',
          type: 'group',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'link',
          },
          fields: [
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
              validate: (val: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
                siblingData?.type === 'internal' && !val ? 'Page is required' : true,
            },
            {
              name: 'url',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'external',
              },
              validate: (val: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
                siblingData?.type === 'external' && !val ? 'URL is required' : true,
            },
            {
              name: 'newTab',
              type: 'checkbox',
              label: 'Open in new tab',
            },
          ],
        },
        {
          name: 'children',
          type: 'array',
          label: 'Dropdown Items',
          maxRows: 10,
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'dropdown',
          },
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
              validate: (val: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
                siblingData?.type === 'internal' && !val ? 'Page is required' : true,
            },
            {
              name: 'url',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'external',
              },
              validate: (val: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
                siblingData?.type === 'external' && !val ? 'URL is required' : true,
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
      name: 'ctaButton',
      type: 'group',
      label: 'CTA Button',
      localized: true,
      fields: [
        {
          name: 'show',
          type: 'checkbox',
          label: 'Show CTA button',
        },
        {
          name: 'label',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.show,
          },
        },
        {
          name: 'url',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.show,
          },
        },
      ],
    },
  ],
}
