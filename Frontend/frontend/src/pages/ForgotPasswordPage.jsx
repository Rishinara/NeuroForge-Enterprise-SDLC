import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, extractErrorMessage } from '../api/client.js'
import AuthLayout from '../components/AuthLayout.jsx'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
    
      await api.post('/auth/forgot-password', { email })
      navigate('/reset-password', { state: { email } })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Reset password"
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send a 6-digit code to reset it."
      footer={
        <>
          Remembered it? <Link to="/login">Back to sign in</Link>
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

        <button className="nf-btn nf-btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Sending code…' : 'Send reset code'}
        </button>
      </form>
    </AuthLayout>
  )
}