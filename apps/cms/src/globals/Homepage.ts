import type { GlobalConfig } from 'payload'

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
      blocks: [
        // Hero Section
        {
          slug: 'hero',
          labels: {
            singular: 'Hero Section',
            plural: 'Hero Sections',
          },
          fields: [
            {
              name: 'variant',
              type: 'select',
              defaultValue: 'full',
              options: [
                { label: 'Full Width Image', value: 'full' },
                { label: 'Split (Image + Text)', value: 'split' },
                { label: 'Video Background', value: 'video' },
              ],
            },
            {
              name: 'heading',
              type: 'text',
              required: true,
              admin: {
                placeholder: 'Your skin deserves the best',
              },
            },
            {
              name: 'subheading',
              type: 'textarea',
            },
            {
              name: 'backgroundImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                condition: (_, siblingData) =>
                  siblingData?.variant === 'full' || siblingData?.variant === 'split',
              },
            },
            {
              name: 'videoUrl',
              type: 'text',
              admin: {
                description: 'YouTube or Vimeo embed URL',
                condition: (_, siblingData) => siblingData?.variant === 'video',
              },
            },
            {
              name: 'cta',
              type: 'group',
              label: 'Call to Action',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  defaultValue: 'Shop Now',
                },
                {
                  name: 'url',
                  type: 'text',
                  defaultValue: '/shop',
                },
              ],
            },
            {
              name: 'textPosition',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
            },
            {
              name: 'textColor',
              type: 'select',
              defaultValue: 'light',
              options: [
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
              ],
            },
          ],
        },

        // Featured Products Section
        {
          slug: 'featured-products',
          labels: {
            singular: 'Featured Products',
            plural: 'Featured Products Sections',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              defaultValue: 'Featured Products',
            },
            {
              name: 'subheading',
              type: 'text',
            },
            {
              name: 'displayType',
              type: 'select',
              defaultValue: 'grid',
              options: [
                { label: 'Grid', value: 'grid' },
                { label: 'Carousel', value: 'carousel' },
              ],
            },
            {
              name: 'products',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              maxRows: 8,
              admin: {
                description: 'Pick from Product content (synced from Medusa)',
              },
            },
            {
              name: 'productHandles',
              type: 'array',
              label: 'Or by handle (fallback)',
              maxRows: 8,
              admin: {
                description: 'Medusa product handles if not using Products above',
              },
              fields: [
                {
                  name: 'handle',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'cta',
              type: 'group',
              label: 'View All Link',
              fields: [
                {
                  name: 'show',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'text',
                  type: 'text',
                  defaultValue: 'View All Products',
                  admin: {
                    condition: (_, siblingData) => siblingData?.show,
                  },
                },
                {
                  name: 'url',
                  type: 'text',
                  defaultValue: '/shop',
                  admin: {
                    condition: (_, siblingData) => siblingData?.show,
                  },
                },
              ],
            },
          ],
        },

        // Categories/Collections Section
        {
          slug: 'categories',
          labels: {
            singular: 'Categories Section',
            plural: 'Categories Sections',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              defaultValue: 'Shop by Category',
            },
            {
              name: 'layout',
              type: 'select',
              defaultValue: 'grid',
              options: [
                { label: 'Grid', value: 'grid' },
                { label: 'Featured (Large + Small)', value: 'featured' },
                { label: 'Horizontal Scroll', value: 'scroll' },
              ],
            },
            {
              name: 'categories',
              type: 'array',
              maxRows: 6,
              fields: [
                {
                  name: 'category',
                  type: 'relationship',
                  relationTo: 'categories',
                  admin: {
                    description: 'Link to Category (url defaults to /shop/category/{handle})',
                  },
                },
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'url',
                  type: 'text',
                  admin: {
                    placeholder: '/shop/category-slug (or leave empty when using Category link)',
                  },
                },
                {
                  name: 'description',
                  type: 'text',
                },
              ],
            },
          ],
        },

        // Testimonials Section
        {
          slug: 'testimonials',
          labels: {
            singular: 'Testimonials',
            plural: 'Testimonials Sections',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              defaultValue: 'What Our Customers Say',
            },
            {
              name: 'displayType',
              type: 'select',
              defaultValue: 'carousel',
              options: [
                { label: 'Carousel', value: 'carousel' },
                { label: 'Grid', value: 'grid' },
              ],
            },
            {
              name: 'testimonials',
              type: 'array',
              maxRows: 10,
              fields: [
                {
                  name: 'quote',
                  type: 'textarea',
                  required: true,
                },
                {
                  name: 'author',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'location',
                  type: 'text',
                },
                {
                  name: 'rating',
                  type: 'number',
                  min: 1,
                  max: 5,
                  defaultValue: 5,
                },
                {
                  name: 'product',
                  type: 'relationship',
                  relationTo: 'products',
                  admin: {
                    description: 'Optional: Link to reviewed product (from Product content)',
                  },
                },
                {
                  name: 'productHandle',
                  type: 'text',
                  admin: {
                    description: 'Or Medusa product handle (fallback)',
                  },
                },
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Optional: Customer photo',
                  },
                },
              ],
            },
          ],
        },

        // Content/About Block
        {
          slug: 'content-block',
          labels: {
            singular: 'Content Block',
            plural: 'Content Blocks',
          },
          fields: [
            {
              name: 'layout',
              type: 'select',
              defaultValue: 'text-image',
              options: [
                { label: 'Text + Image', value: 'text-image' },
                { label: 'Image + Text', value: 'image-text' },
                { label: 'Text Only (Centered)', value: 'text-only' },
                { label: 'Full Width Image with Overlay', value: 'full-width' },
              ],
            },
            {
              name: 'heading',
              type: 'text',
            },
            {
              name: 'content',
              type: 'richText',
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                condition: (_, siblingData) => siblingData?.layout !== 'text-only',
              },
            },
            {
              name: 'cta',
              type: 'group',
              fields: [
                {
                  name: 'show',
                  type: 'checkbox',
                },
                {
                  name: 'text',
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
            {
              name: 'backgroundColor',
              type: 'select',
              defaultValue: 'white',
              options: [
                { label: 'White', value: 'white' },
                { label: 'Light Gray', value: 'gray' },
                { label: 'Brand Light', value: 'brand-light' },
              ],
            },
          ],
        },

        // Newsletter Signup Section
        {
          slug: 'newsletter',
          labels: {
            singular: 'Newsletter Section',
            plural: 'Newsletter Sections',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              defaultValue: 'Join Our Newsletter',
            },
            {
              name: 'description',
              type: 'textarea',
              defaultValue: 'Subscribe for exclusive offers, skincare tips, and new product launches.',
            },
            {
              name: 'backgroundColor',
              type: 'select',
              defaultValue: 'brand',
              options: [
                { label: 'Brand Color', value: 'brand' },
                { label: 'Dark', value: 'dark' },
                { label: 'Light', value: 'light' },
              ],
            },
            {
              name: 'incentive',
              type: 'text',
              admin: {
                placeholder: 'e.g., Get 10% off your first order',
              },
            },
          ],
        },

        // Blog/Articles Carousel
        {
          slug: 'blog-carousel',
          labels: {
            singular: 'Blog Carousel',
            plural: 'Blog Carousels',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              defaultValue: 'From Our Blog',
            },
            {
              name: 'subheading',
              type: 'text',
            },
            {
              name: 'source',
              type: 'select',
              defaultValue: 'latest',
              options: [
                { label: 'Latest Articles', value: 'latest' },
                { label: 'Specific Category', value: 'category' },
                { label: 'Manual Selection', value: 'manual' },
              ],
            },
            {
              name: 'category',
              type: 'select',
              options: [
                { label: 'Skincare Tips', value: 'skincare-tips' },
                { label: 'Product Guides', value: 'product-guides' },
                { label: 'Ingredient Spotlight', value: 'ingredients' },
                { label: 'Routine Advice', value: 'routines' },
              ],
              admin: {
                condition: (_, siblingData) => siblingData?.source === 'category',
              },
            },
            {
              name: 'articles',
              type: 'relationship',
              relationTo: 'articles',
              hasMany: true,
              maxRows: 6,
              admin: {
                condition: (_, siblingData) => siblingData?.source === 'manual',
              },
            },
            {
              name: 'limit',
              type: 'number',
              defaultValue: 4,
              min: 2,
              max: 6,
              admin: {
                condition: (_, siblingData) => siblingData?.source !== 'manual',
              },
            },
            {
              name: 'cta',
              type: 'group',
              fields: [
                {
                  name: 'show',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'text',
                  type: 'text',
                  defaultValue: 'Read More',
                  admin: {
                    condition: (_, siblingData) => siblingData?.show,
                  },
                },
                {
                  name: 'url',
                  type: 'text',
                  defaultValue: '/blog',
                  admin: {
                    condition: (_, siblingData) => siblingData?.show,
                  },
                },
              ],
            },
          ],
        },

        // Brands Banner
        {
          slug: 'brands-banner',
          labels: {
            singular: 'Brands Banner',
            plural: 'Brands Banners',
          },
          fields: [
            {
              name: 'heading',
              type: 'text',
              defaultValue: 'Our Brands',
            },
            {
              name: 'displayType',
              type: 'select',
              defaultValue: 'scroll',
              options: [
                { label: 'Auto Scroll', value: 'scroll' },
                { label: 'Static Grid', value: 'grid' },
              ],
            },
            {
              name: 'brands',
              type: 'array',
              maxRows: 12,
              fields: [
                {
                  name: 'brand',
                  type: 'relationship',
                  relationTo: 'brands',
                  admin: {
                    description: 'Link to Brand (url from brandKey)',
                  },
                },
                {
                  name: 'name',
                  type: 'text',
                  admin: {
                    description: 'Override display name (or from Brand)',
                  },
                },
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Override logo (or from Brand)',
                  },
                },
                {
                  name: 'url',
                  type: 'text',
                  admin: {
                    placeholder: '/shop/brand/brand-name',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
