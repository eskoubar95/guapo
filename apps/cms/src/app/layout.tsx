import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guapo CMS',
  description: 'Content Management System for Guapo',
}

/**
 * Root layout: no <html>/<body> here so Payload's (payload) layout can provide its own.
 * The (site) route group adds html/body for the home page; (payload) uses Payload's RootLayout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
