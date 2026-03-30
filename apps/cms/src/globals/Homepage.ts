import type { Block, GlobalConfig } from 'payload'
import { sectionBlocks } from '../fields/sectionBlocks'

/**
 * Homepage Builder Global
 *
 * Allows editors to build the homepage using predefined section types.
 * Sections are reorderable and limited to 10 maximum for performance.
 */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  admin: {
    group: 'Site Settings',
    description: 'Build your homepage with reorderable sections (max 10)',
  },
  fields: [
    {
      name: 'meta',
      type: 'group',
      label: 'Page SEO',
      localized: true,
      fields: [
        {
          name: 'title',
          type: 'text',
          defaultValue: 'Guapo - Premium Skincare',
        },
        {
          name: 'description',
          type: 'textarea',
          defaultValue: 'Discover premium skincare products curated for your skin.',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Social Share Image',
        },
      ],
    },
    {
      name: 'sections',
      type: 'blocks',
      label: 'Page Sections',
      maxRows: 10,
      localized: true,
      blocks: sectionBlocks as Block[],
    },
  ],
}
