import type { GlobalConfig } from 'payload'

const ICON_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Grid (submenu)', value: 'grid' },
  { label: 'Tag', value: 'tag' },
  { label: 'Sparkles', value: 'sparkles' },
  { label: 'Shopping bag', value: 'shopping-bag' },
  { label: 'File text', value: 'file-text' },
  { label: 'Home', value: 'home' },
]

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Site Navigation',
  admin: {
    group: 'Site Settings',
  },
  fields: [
    {
      name: 'menuSections',
      type: 'array',
      label: 'Menu Sections',
      admin: {
        description: 'Each section is shown as a separate block in the sidebar. Choose "Card" for a white box with rounded corners, or "Flat" to place items directly on the sidebar background.',
      },
      maxRows: 6,
      localized: true,
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Section title',
          admin: {
            description: 'Optional heading above this block (e.g. "Shop", "Kundeservice"). Leave empty for no title.',
          },
        },
        {
          name: 'sectionStyle',
          type: 'select',
          label: 'Section style',
          defaultValue: 'card',
          admin: {
            description: 'Card = white box with rounded corners. Flat = items sit directly on the sidebar background (no box).',
          },
          options: [
            { label: 'Card (white box, rounded)', value: 'card' },
            { label: 'Flat (no box, on sidebar background)', value: 'flat' },
          ],
        },
        {
          name: 'items',
          type: 'array',
          label: 'Menu items',
          maxRows: 12,
          required: true,
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
              name: 'icon',
              type: 'select',
              label: 'Icon',
              options: ICON_OPTIONS,
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
                { name: 'newTab', type: 'checkbox', label: 'Open in new tab' },
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
                { name: 'label', type: 'text', required: true },
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
                  admin: { condition: (_, siblingData) => siblingData?.type === 'internal' },
                  validate: (val: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
                    siblingData?.type === 'internal' && !val ? 'Page is required' : true,
                },
                {
                  name: 'url',
                  type: 'text',
                  admin: { condition: (_, siblingData) => siblingData?.type === 'external' },
                  validate: (val: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
                    siblingData?.type === 'external' && !val ? 'URL is required' : true,
                },
                { name: 'newTab', type: 'checkbox', label: 'Open in new tab' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'mainMenu',
      type: 'array',
      label: 'Main Menu (fallback)',
      admin: {
        description: 'Used only if no Menu Sections are defined. Prefer Menu Sections for multiple boxes.',
      },
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
          name: 'icon',
          type: 'select',
          label: 'Icon',
          admin: {
            description: 'Optional icon for this menu item. Leave empty for no icon.',
          },
          options: ICON_OPTIONS,
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
      name: 'promotionBar',
      type: 'group',
      label: 'Promotion bar (top banner)',
      admin: {
        description: 'The bar above the main header. Shown when enabled; text and optional link are editable.',
      },
      localized: true,
      fields: [
        {
          name: 'show',
          type: 'checkbox',
          label: 'Show promotion bar',
          defaultValue: true,
        },
        {
          name: 'text',
          type: 'text',
          label: 'Text',
          admin: {
            condition: (_, siblingData) => siblingData?.show,
          },
          validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
            siblingData?.show && !value ? 'Text is required when promotion bar is shown' : true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'Link URL (optional)',
          admin: {
            description: 'If set, the whole bar becomes a link.',
            condition: (_, siblingData) => siblingData?.show,
          },
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
