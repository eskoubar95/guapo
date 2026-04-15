import '../globals.css'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="site-root">{children}</body>
    </html>
  )
}
