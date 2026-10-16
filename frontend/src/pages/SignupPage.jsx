import { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { extractErrorMessage } from '../api/client.js'
import AuthLayout from '../components/AuthLayout.jsx'

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
)


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
    value: ROLES.FRONTEND_DEVELOPER,
    label: 'Frontend Developer',
    hint: 'Build user interfaces, components, and frontend features.',
  },
  {
    value: ROLES.BACKEND_DEVELOPER,
    label: 'Backend Developer',
    hint: 'Build APIs, business logic, databases, and microservices.',
  },
  {
    value: ROLES.DEVELOPER,
    label: 'Fullstack / General Developer',
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

const PHONE_PATTERN = /^[6-9]\d{9}$/
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).*$/

function parseOrgId(input) {
  if (!input) return null
  const cleaned = input.toString().trim().replace(/^org-?/i, '')
  const num = parseInt(cleaned, 10)
  return isNaN(num) || num <= 0 ? null : num
}

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({
    fullName: '',
    email: searchParams.get('email') || '',
    phone: '',
    role: '',
    password: '',
    confirmPassword: '',
    orgId: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/dashboard'

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function validate() {
    if (!form.fullName.trim() || form.fullName.trim().length < 3) return 'Full name must be at least 3 characters.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.'
    if (!PHONE_PATTERN.test(form.phone)) return 'Enter a valid 10-digit mobile number starting with 6-9.'
    if (!form.role) return 'Select a role to continue.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (!PASSWORD_PATTERN.test(form.password)) return 'Password must contain uppercase, lowercase, digit, and special character (@$!%*?&).'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    
    if (form.role && form.role !== ROLES.SUPER_ADMIN && form.role !== ROLES.ORG_ADMIN) {
      if (!form.orgId.trim()) {
        return 'Please enter your Organization Specific ID (e.g., ORG-1 or 1).'
      }
      if (!parseOrgId(form.orgId)) {
        return 'Invalid Organization ID format. Please enter an ID like ORG-1 or 1.'
      }
    } else if (form.role === ROLES.ORG_ADMIN && form.orgId.trim()) {
      if (!parseOrgId(form.orgId)) {
        return 'Invalid Organization ID format. Please enter an ID like ORG-1 or 1.'
      }
    }
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
    const parsedId = parseOrgId(form.orgId)
    try {
      await signup({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        password: form.password,
        ...(parsedId ? { orgId: parsedId } : {}),
      })
      navigate(redirectTo, { replace: true })
    } catch (err) {
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

        {form.role && form.role !== ROLES.SUPER_ADMIN && (
          <div className="nf-field">
            <label className="nf-label" htmlFor="orgId">
              Organization Specific ID {form.role !== ROLES.ORG_ADMIN ? '*' : '(Optional)'}
            </label>
            <input
              id="orgId"
              type="text"
              className="nf-input"
              autoComplete="off"
              placeholder="e.g. ORG-1 or 1"
              value={form.orgId}
              onChange={update('orgId')}
            />
            <p className="nf-role-hint">
              {form.role === ROLES.ORG_ADMIN
                ? 'Enter your Organization ID if already assigned by Super Admin, or leave blank.'
                : 'Enter the Organization Specific ID given by your Org Admin to join that organization.'}
            </p>
          </div>
        )}

        <div className="nf-row-2">
          <div className="nf-field">
            <label className="nf-label" htmlFor="password">
              Password
            </label>
            <div className="nf-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="nf-input"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={update('password')}
              />
              <button
                type="button"
                className="nf-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          <div className="nf-field">
            <label className="nf-label" htmlFor="confirmPassword">
              Confirm password
            </label>
            <div className="nf-password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="nf-input"
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
              />
              <button
                type="button"
                className="nf-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>
        </div>

        <button className="nf-btn nf-btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account & continue'}
        </button>
      </form>
    </AuthLayout>
  )
}