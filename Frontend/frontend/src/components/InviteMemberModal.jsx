import { useState } from 'react'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Modal from './Modal.jsx'

const INVITE_ROLE_OPTIONS = [
  { value: ROLES.PROJECT_MANAGER, label: 'Project Manager' },
  { value: ROLES.DEVELOPER, label: 'Developer' },
  { value: ROLES.QA_TESTER, label: 'QA / Tester' },
  { value: ROLES.CLIENT, label: 'Client / Stakeholder' },
  { value: ROLES.ORG_ADMIN, label: 'Org Admin' },
]

export default function InviteMemberModal({ open, onClose, onInvited }) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function reset() {
    setEmail('')
    setRole('')
    setError('')
    setSent(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    if (!role) return setError('Select a role for this invite.')

    setError('')
    setSubmitting(true)
    try {
      // POST /api/orgs/{orgId}/invites -> unique token saved, email sent via JavaMailSender
      await orgApi.inviteMember(user.orgId, { email, role })
      setSent(true)
      onInvited?.()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Invite a member">
      {sent ? (
        <div>
          <p className="nf-alert nf-alert-success">
            Invite sent to {email}. They'll get an email with a link to join.
          </p>
          <button className="nf-btn nf-btn-primary" onClick={handleClose}>Done</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {error && <p className="nf-alert nf-alert-error">{error}</p>}

          <div className="nf-field">
            <label className="nf-label" htmlFor="invite-email">Email address</label>
            <input
              id="invite-email"
              type="email"
              className="nf-input"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="nf-field">
            <label className="nf-label" htmlFor="invite-role">Role</label>
            <select id="invite-role" className="nf-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="" disabled>Select a role…</option>
              {INVITE_ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <button className="nf-btn nf-btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Sending invite…' : 'Send invite'}
          </button>
        </form>
      )}
    </Modal>
  )
}