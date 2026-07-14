import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22 }}>You don't have access to this page</h1>
      <p style={{ color: '#8a90a6', fontSize: 14 }}>Your role doesn't include this permission.</p>
      <Link to="/dashboard" style={{ color: '#6c63ff', fontWeight: 600 }}>Back to dashboard</Link>
    </div>
  )
}