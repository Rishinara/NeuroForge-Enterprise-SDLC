import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { extractErrorMessage } from '../api/client.js'
import AuthLayout from '../components/AuthLayout.jsx'


const ROLE_OPTIONS = [
  {
    value: ROLES.ORG_ADMIN,
    label: 'Org Admin',
    hint: "You'll set up your organization, invite your team, and manage roles.",
  },
  {
    value: ROLES.PROJECT_MANAGER,
    label: 'Project Manager',
    hint: 'Create projects, plan sprints, assign tasks, and manage releases.',
  },
  {
    value: ROLES.DEVELOPER,
    label: 'Developer',
    hint: 'View your tasks, submit code for AI review, and log your work.',
  },
  {
    value: ROLES.QA_TESTER,
    label: 'QA / Tester',
    hint: 'Create test cases, report bugs, and manage test runs.',
  },
  {
    value: ROLES.CLIENT,
    label: 'Client / Stakeholder',
    hint: 'Read-only access to project progress, milestones, and release notes.',
  },
]

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function validate() {
    if (!form.fullName || !form.fullName.trim()) return 'Enter your full name.'
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.'
    if (!form.phone || !PHONE_PATTERN.test(form.phone)) return 'Enter a valid phone number.'
    if (!form.role) return 'Select a role to continue.'

    if (!form.password || form.password.length < 8) {
      return 'Password must be at least 8 characters long.'
    }
    if (!/[A-Z]/.test(form.password)) {
      return 'Password must contain at least one uppercase letter.'
    }
    if (!/[0-9]/.test(form.password)) {
      return 'Password must contain at least one number.'
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      return 'Password must contain at least one special character.'
    }

    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await signup({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        password: form.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      // Extracts clear text error from backend response (avoids ambiguous errors)
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedRole = ROLE_OPTIONS.find((r) => r.value === form.role)

  return (
      <AuthLayout
          eyebrow="Create account"
          title="Set up your workspace"
          subtitle="Tell us who you are and how you'll be using NeuroForge."
          footer={
            <>
              Already have an account? <Link to="/login">Sign in</Link>
            </>
          }
      >
        <form onSubmit={handleSubmit} noValidate>
          {error && <p className="nf-alert nf-alert-error">{error}</p>}

          <div className="nf-field">
            <label className="nf-label" htmlFor="fullName">
              Full name
            </label>
            <input
                id="fullName"
                type="text"
                className="nf-input"
                autoComplete="name"
                placeholder="Jordan Lee"
                value={form.fullName}
                onChange={update('fullName')}
            />
          </div>

          <div className="nf-field">
            <label className="nf-label" htmlFor="email">
              Email address
            </label>
            <input
                id="email"
                type="email"
                className="nf-input"
                autoComplete="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={update('email')}
            />
          </div>

          <div className="nf-field">
            <label className="nf-label" htmlFor="phone">
              Phone number
            </label>
            <input
                id="phone"
                type="tel"
                className="nf-input"
                autoComplete="tel"
                placeholder="+1 (555) 123-4567"
                value={form.phone}
                onChange={update('phone')}
            />
          </div>

          <div className="nf-field">
            <label className="nf-label" htmlFor="role">
              Your role
            </label>
            <select id="role" className="nf-select" value={form.role} onChange={update('role')}>
              <option value="" disabled>
                Select a role…
              </option>
              {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
              ))}
            </select>
            {selectedRole && <p className="nf-role-hint">{selectedRole.hint}</p>}
          </div>

          <div className="nf-row-2">
            <div className="nf-field">
              <label className="nf-label" htmlFor="password">
                Password
              </label>
              <input
                  id="password"
                  type="password"
                  className="nf-input"
                  autoComplete="new-password"
                  placeholder="8+ chars, upper, num, special"
                  value={form.password}
                  onChange={update('password')}
              />
            </div>

            <div className="nf-field">
              <label className="nf-label" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                  id="confirmPassword"
                  type="password"
                  className="nf-input"
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
              />
            </div>
          </div>

          <button className="nf-btn nf-btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account & continue'}
          </button>
        </form>
      </AuthLayout>
  )
}