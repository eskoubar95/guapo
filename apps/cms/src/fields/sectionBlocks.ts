/** Shared section blocks for Homepage global and Pages (homepage/landing types). */
type ConditionArg = Record<string, unknown>
export const sectionBlocks = [
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
          condition: (_: ConditionArg, siblingData: ConditionArg) =>
            siblingData?.variant === 'full' || siblingData?.variant === 'split',
        },
      },
      {
        name: 'videoUrl',
        type: 'text',
        admin: {
          description: 'YouTube or Vimeo embed URL',
          condition: (_: ConditionArg, siblingData: ConditionArg) => siblingData?.variant === 'video',
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
              condition: (_: ConditionArg, siblingData: ConditionArg) => siblingData?.show,
            },
          },
          {
            name: 'url',
            type: 'text',
            defaultValue: '/shop',
            admin: {
              condition: (_: ConditionArg, siblingData: ConditionArg) => siblingData?.show,
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
          { label: 'Text Only (Left-aligned)', value: 'text-only-left' },
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
          condition: (_: ConditionArg, siblingData: ConditionArg) => {
            const layout = siblingData?.layout as string | undefined;
            return layout !== 'text-only' && layout !== 'text-only-left';
          },
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
              condition: (_: ConditionArg, siblingData: ConditionArg) => siblingData?.show,
            },
          },
          {
            name: 'url',
            type: 'text',
            admin: {
              condition: (_: ConditionArg, siblingData: ConditionArg) => siblingData?.show,
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

  // Image + Text with breakout (billede går ud over højden)
  {
    slug: 'image-text-breakout',
    labels: {
      singular: 'Image + Text (Breakout)',
      plural: 'Image + Text (Breakout)',
    },
    fields: [
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        required: true,
        admin: {
          description: 'Billede der vises i den ene kolonne og “bryder ud” over baggrundens højde.',
        },
      },
      {
        name: 'imagePosition',
        type: 'select',
        defaultValue: 'left',
        options: [
          { label: 'Venstre', value: 'left' },
          { label: 'Højre', value: 'right' },
        ],
        admin: {
          description: 'Om billedet skal stå til venstre eller højre for teksten.',
        },
      },
      {
        name: 'heading',
        type: 'text',
        required: true,
        admin: {
          placeholder: 'F.eks. Ønskeskyen favoritter til fast lav pris',
        },
      },
      {
        name: 'body',
        type: 'textarea',
        admin: {
          description: 'Valgfri brødtekst under overskriften.',
        },
      },
      {
        name: 'ctaText',
        type: 'text',
        defaultValue: 'Shop nu',
        admin: {
          description: 'Tekst på CTA-knap/link.',
        },
      },
      {
        name: 'ctaUrl',
        type: 'text',
        defaultValue: '/categories',
        admin: {
          description: 'Link ved klik (fx /categories eller /da/products/xyz).',
        },
      },
      {
        name: 'imageColumnBackground',
        type: 'select',
        dbName: 'imgColBg',
        defaultValue: 'light-blue',
        options: [
          { label: 'Lys blå', value: 'light-blue' },
          { label: 'Lys grå', value: 'light-gray' },
          { label: 'Hvid', value: 'white' },
        ],
        admin: {
          description: 'Baggrundsfarve på kolonnen med billedet (billedet “bryder ud” over denne).',
        },
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
          condition: (_: ConditionArg, siblingData: ConditionArg) => siblingData?.source === 'category',
        },
      },
      {
        name: 'articles',
        type: 'relationship',
        relationTo: 'articles',
        hasMany: true,
        maxRows: 6,
        admin: {
          condition: (_: ConditionArg, siblingData: ConditionArg) => siblingData?.source === 'manual',
        },
      },
      {
        name: 'limit',
        type: 'number',
        defaultValue: 4,
        min: 2,
        max: 6,
        admin: {
          condition: (_: ConditionArg, siblingData: ConditionArg) => siblingData?.source !== 'manual',
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
              condition: (_: ConditionArg, siblingData: ConditionArg) => siblingData?.show,
            },
          },
          {
            name: 'url',
            type: 'text',
            defaultValue: '/blog',
            admin: {
              condition: (_: ConditionArg, siblingData: ConditionArg) => siblingData?.show,
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

  // Promotion Slider (banner carousel: image only + link)
  {
    slug: 'promotion-slider',
    labels: {
      singular: 'Promotion Slider',
      plural: 'Promotion Sliders',
    },
    fields: [
      {
        name: 'slides',
        type: 'array',
        maxRows: 5,
        required: true,
        fields: [
          {
            name: 'imageDesktop',
            type: 'upload',
            relationTo: 'media',
            required: true,
            admin: {
              description: 'Baggrundsbillede til desktop. Bruges som fallback hvis tablet/mobil ikke er sat.',
            },
          },
          {
            name: 'imageTablet',
            type: 'upload',
            relationTo: 'media',
            admin: {
              description: 'Valgfrit: andet billede til tablet (fx 768px–1024px). Tom = bruger desktop-billedet.',
            },
          },
          {
            name: 'imageMobile',
            type: 'upload',
            relationTo: 'media',
            admin: {
              description: 'Valgfrit: andet billede til mobil. Tom = bruger desktop- eller tablet-billedet.',
            },
          },
          {
            name: 'href',
            type: 'text',
            admin: {
              description: 'Link når man klikker på slide (fx /categories eller /da/products/xyz). Tom = slide er ikke klikbar.',
            },
          },
        ],
      },
    ],
  },

  // Inspiration & Guides (content cards: title, subtitle, cards with image/tag/title/excerpt/link)
  {
    slug: 'inspiration-guides',
    labels: {
      singular: 'Inspiration & Guides',
      plural: 'Inspiration & Guides',
    },
    fields: [
      {
        name: 'heading',
        type: 'text',
        defaultValue: 'Inspiration & Guides',
      },
      {
        name: 'subheading',
        type: 'text',
        admin: { placeholder: 'e.g. Lær mere om hudpleje' },
      },
      {
        name: 'layout',
        type: 'select',
        defaultValue: 'carousel',
        options: [
          { label: 'Carousel', value: 'carousel' },
          { label: 'Grid', value: 'grid' },
        ],
      },
      {
        name: 'cards',
        type: 'array',
        maxRows: 12,
        required: true,
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'label', type: 'text', admin: { description: 'Tag e.g. Guide, Tips' } },
          { name: 'excerpt', type: 'textarea' },
          { name: 'image', type: 'upload', relationTo: 'media', required: true },
          { name: 'url', type: 'text', required: true, admin: { placeholder: '/blog/slug or full path' } },
        ],
      },
    ],
  },

  // Brand Spotlight (single brand: name, description, CTA, image, optional products)
  {
    slug: 'brand-spotlight',
    labels: {
      singular: 'Brand Spotlight',
      plural: 'Brand Spotlights',
    },
    fields: [
      {
        name: 'brand',
        type: 'relationship',
        relationTo: 'brands',
        required: true,
        admin: { description: 'Brand (name/link from Brand)' },
      },
      {
        name: 'title',
        type: 'text',
        admin: { description: 'Override brand name if needed' },
      },
      {
        name: 'description',
        type: 'textarea',
        required: true,
      },
      {
        name: 'image',
        type: 'upload',
        relationTo: 'media',
        admin: { description: 'Optional hero image for the section' },
      },
      {
        name: 'ctaText',
        type: 'text',
        defaultValue: 'Se alle produkter',
      },
      {
        name: 'ctaUrl',
        type: 'text',
        admin: { description: 'Leave empty to use brand page from Brand relationship' },
      },
      {
        name: 'productHandles',
        type: 'array',
        maxRows: 8,
        admin: { description: 'Optional: Medusa product handles to feature' },
        fields: [{ name: 'handle', type: 'text', required: true }],
      },
    ],
  },

  // Service Strip (promo cards: icon, title, subtitle, link — e.g. abonnement, gavekort, nyhedsbrev)
  {
    slug: 'service-strip',
    labels: {
      singular: 'Service Strip',
      plural: 'Service Strips',
    },
    fields: [
      {
        name: 'variant',
        type: 'select',
        defaultValue: 'minimal',
        options: [
          { label: 'Minimal (ikon-linje)', value: 'minimal' },
          { label: 'Cards (individuelle kort)', value: 'cards' },
        ],
        admin: { description: 'Minimal = kompakt linje med separatorer. Cards = individuelle kort med baggrund.' },
      },
      {
        name: 'backgroundColor',
        type: 'select',
        defaultValue: 'muted',
        options: [
          { label: 'Light Muted', value: 'muted' },
          { label: 'White', value: 'white' },
        ],
      },
      {
        name: 'items',
        type: 'array',
        maxRows: 6,
        required: true,
        fields: [
          {
            name: 'iconType',
            type: 'select',
            defaultValue: 'none',
            options: [
              { label: 'Ingen (kun titel + undertitel)', value: 'none' },
              { label: 'Subscription (loop arrows)', value: 'subscription' },
              { label: 'Gift', value: 'gift' },
              { label: 'Newsletter (envelope)', value: 'newsletter' },
              { label: 'Truck (shipping)', value: 'truck' },
              { label: 'Shield', value: 'shield' },
              { label: 'Return', value: 'return' },
              { label: 'Headphones', value: 'headphones' },
              { label: 'Custom image', value: 'custom' },
            ],
            admin: { description: 'Vælg "Ingen" for mission/vision-kort uden ikon.' },
          },
          {
            name: 'iconImage',
            type: 'upload',
            relationTo: 'media',
            admin: { condition: (_: ConditionArg, siblingData: ConditionArg) => siblingData?.iconType === 'custom' },
          },
          { name: 'title', type: 'text', required: true },
          { name: 'subtitle', type: 'text' },
          { name: 'url', type: 'text', admin: { placeholder: '/path or full URL' } },
        ],
      },
    ],
  },

  // Bullet columns (e.g. for About: "Hvorfor vælge os" with 2–3 columns of bullet lists)
  {
    slug: 'bullet-columns',
    labels: {
      singular: 'Bullet Columns',
      plural: 'Bullet Columns',
    },
    fields: [
      {
        name: 'heading',
        type: 'text',
        admin: { placeholder: 'e.g. Hvorfor vælge os?' },
      },
      {
        name: 'columns',
        type: 'array',
        minRows: 2,
        maxRows: 4,
        required: true,
        fields: [
          { name: 'columnHeading', type: 'text', admin: { description: 'Optional heading for this column' } },
          {
            name: 'items',
            type: 'array',
            required: true,
            minRows: 1,
            fields: [{ name: 'text', type: 'text', required: true }],
            admin: { description: 'Bullet points for this column' },
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

  // Value cards (e.g. Mission & Vision — two cards side by side)
  {
    slug: 'value-cards',
    labels: {
      singular: 'Value Cards (Mission / Vision)',
      plural: 'Value Cards',
    },
    fields: [
      {
        name: 'heading',
        type: 'text',
        admin: { placeholder: 'e.g. Vores værdier' },
      },
      {
        name: 'cards',
        type: 'array',
        minRows: 2,
        maxRows: 4,
        required: true,
        fields: [
          { name: 'title', type: 'text', required: true, admin: { placeholder: 'e.g. Vores mission' } },
          { name: 'body', type: 'textarea', required: true, admin: { placeholder: 'Card content' } },
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
];
