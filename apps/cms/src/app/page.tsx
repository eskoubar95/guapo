import Link from 'next/link'

export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ marginBottom: '1rem' }}>Guapo CMS</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Content Management System powered by Payload
      </p>
      <Link
        href="/admin"
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#000',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '4px',
        }}
      >
        Go to Admin Panel
      </Link>
    </main>
  )
}
