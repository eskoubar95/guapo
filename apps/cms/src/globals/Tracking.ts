import type { GlobalConfig } from 'payload'

const GTM_ID_RE = /^GTM-[A-Z0-9]+$/

export const Tracking: GlobalConfig = {
  slug: 'tracking',
  label: 'Tracking & Tag Manager',
  admin: {
    group: 'Site Settings',
    description:
      'Google Tag Manager container ID. Configure GA4, Meta Pixel, and other tags inside GTM. The storefront loads GTM only after analytics or marketing consent.',
  },
  fields: [
    {
      name: 'gtmEnabled',
      type: 'checkbox',
      label: 'Enable Google Tag Manager',
      defaultValue: false,
    },
    {
      name: 'gtmContainerId',
      type: 'text',
      label: 'GTM container ID',
      admin: {
        description: 'Format: GTM-XXXXXXX (from Tag Manager → Admin → Install Google Tag Manager).',
        condition: (_, siblingData) => Boolean(siblingData?.gtmEnabled),
      },
      validate: (
        val: string | null | undefined,
        { siblingData }: { siblingData?: { gtmEnabled?: boolean | null } }
      ) => {
        if (!siblingData?.gtmEnabled) return true
        if (!val?.trim()) return 'Container ID is required when GTM is enabled.'
        if (!GTM_ID_RE.test(val.trim())) {
          return 'Must look like GTM-XXXXXXX (letters and numbers after GTM-).'
        }
        return true
      },
    },
  ],
}
