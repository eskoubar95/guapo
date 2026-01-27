import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Guapo CMS',
  description: 'Content Management System for Guapo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
