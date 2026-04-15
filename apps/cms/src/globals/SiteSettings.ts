import type { GlobalConfig } from 'payload'

/**
 * Sitewide assets for the storefront (favicon, touch icon).
 * Consumed via GET /api/storefront/globals/site-settings.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    group: 'Site Settings',
    description: 'Favicon and Apple touch icon for the storefront (replaces default app icon when set).',
  },
  fields: [
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
      label: 'Favicon',
      admin: {
        description: 'Square image, .ico or PNG (32×32 or 48×48 recommended).',
      },
    },
    {
      name: 'appleTouchIcon',
      type: 'upload',
      relationTo: 'media',
      label: 'Apple touch icon',
      admin: {
        description: 'Optional 180×180 PNG for iOS home screen.',
      },
    },
  ],
}
