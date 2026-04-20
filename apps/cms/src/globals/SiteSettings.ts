import type { GlobalConfig } from 'payload'

/**
 * Sitewide assets for the storefront (favicon, touch icon).
 * Consumed via GET /api/storefront/globals/site-settings.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  access: {
    /** Public storefront reads favicon / touch icon via /api/storefront/globals/site-settings */
    read: () => true,
  },
  admin: {
    group: 'Site Settings',
    description:
      'Favicon, touch icon, and which storefront languages are live (replaces default app icon when set).',
  },
  fields: [
    {
      name: 'enabledStorefrontLocales',
      type: 'select',
      hasMany: true,
      localized: false,
      defaultValue: ['da'],
      label: 'Enabled storefront locales',
      options: [
        { label: 'Danish (da)', value: 'da' },
        { label: 'English (en)', value: 'en' },
      ],
      admin: {
        description:
          'Same list for all CMS locales. Keep English off until the /en storefront is ready; emergency override is possible with PUBLISHED_LOCALES on the storefront.',
      },
      validate: (value: unknown) => {
        const arr = Array.isArray(value) ? (value as string[]) : []
        if (!arr.includes('da')) {
          return 'Danish (da) must remain enabled.'
        }
        return true
      },
    },
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
