import type { GlobalConfig } from 'payload'

/**
 * FAQ content for storefront /support/faq (body copy + FAQPage JSON-LD).
 * When categories are empty per locale, the storefront uses its fallback copy until editors publish here.
 */
export const SupportFaq: GlobalConfig = {
  slug: 'support-faq',
  label: 'Support FAQ',
  admin: {
    group: 'Content',
    description:
      'Structured FAQ shown on /support/faq. Use JSON shape: array of { "name": string, "faqs": [ { "question": string, "answer": string } ] } per locale.',
  },
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'pageTitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Page H1 / browser title when set. Leave empty to use the storefront default for this locale.',
      },
    },
    {
      name: 'categories',
      type: 'json',
      localized: true,
      admin: {
        description:
          'FAQ categories as JSON array, e.g. [{ "name": "Orders", "faqs": [{ "question": "…", "answer": "…" }] }].',
      },
    },
  ],
}
