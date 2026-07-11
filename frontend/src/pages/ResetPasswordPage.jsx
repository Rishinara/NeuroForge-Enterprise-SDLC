import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api, extractErrorMessage } from '../api/client.js'
import AuthLayout from '../components/AuthLayout.jsx'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefillEmail = location.state?.email || ''

  const [email, setEmail] = useState(prefillEmail)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function validate() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address.'
    if (!/^\d{6}$/.test(otp)) return 'Enter the 6-digit code from your email.'
    if (newPassword.length < 8) return 'Password must be at least 8 characters.'
    if (newPassword !== confirmPassword) return 'Passwords do not match.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const v = validate()
    if (v) {
      setError(v)
      return
    }

    setError('')
    setSubmitting(true)
    try {
      // POST /api/auth/reset-password -> { message }
      await api.post('/auth/reset-password', { email, otp, newPassword })
      setDone(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <AuthLayout eyebrow="Reset password" title="Password updated">
        <p className="nf-alert nf-alert-success">
          Your password has been reset. Redirecting you to sign in…
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="Reset password"
      title="Enter your code"
      subtitle="Check your email for the 6-digit code, then set a new password."
      footer={
        <>
          Didn't get a code? <Link to="/forgot-password">Send it again</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <p className="nf-alert nf-alert-error">{error}</p>}

        <div className="nf-field">
          <label className="nf-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="nf-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="nf-field">
          <label className="nf-label" htmlFor="otp">
            6-digit code
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="nf-input"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        <div className="nf-row-2">
          <div className="nf-field">
            <label className="nf-label" htmlFor="newPassword">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              className="nf-input"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="nf-field">
            <label className="nf-label" htmlFor="confirmPassword">
              Confirm
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="nf-input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <button className="nf-btn nf-btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  )
}