import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { extractErrorMessage } from '../api/client.js'
import AuthLayout from '../components/AuthLayout.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = location.state?.from?.pathname || '/dashboard'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Enter both email and password.')
      return
    }

    setSubmitting(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back"
      subtitle="Log in with your organization email to reach your dashboard."
      footer={
        <>
          New to NeuroForge? <Link to="/signup">Create an account</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <p className="nf-alert nf-alert-error">{error}</p>}

        <div className="nf-field">
          <label className="nf-label" htmlFor="email">
            Work email
          </label>
          <input
            id="email"
            type="email"
            className="nf-input"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="nf-field">
          <label className="nf-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="nf-input"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div style={{ textAlign: 'right', marginBottom: 18 }}>
          <Link to="/forgot-password" style={{ fontSize: 12.5, color: 'var(--nf-slate)' }}>
            Forgot password?
          </Link>
        </div>

        <button className="nf-btn nf-btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}