import { useState, useEffect } from 'react'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Modal from './Modal.jsx'

const INVITE_ROLE_OPTIONS = [
  { value: ROLES.PROJECT_MANAGER, label: 'Project Manager' },
  { value: ROLES.FRONTEND_DEVELOPER, label: 'Frontend Developer' },
  { value: ROLES.BACKEND_DEVELOPER, label: 'Backend Developer' },
  { value: ROLES.DEVELOPER, label: 'Fullstack / General Developer' },
  { value: ROLES.QA_TESTER, label: 'QA / Tester' },
  { value: ROLES.CLIENT, label: 'Client / Stakeholder' },
]

export default function InviteMemberModal({ open, onClose, onInvited, targetOrgId }) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [teamId, setTeamId] = useState('')
  const [teams, setTeams] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  // Fetch teams on open
  useEffect(() => {
    if (open) {
      const activeOrgId = targetOrgId || user?.orgId
      if (activeOrgId) {
        orgApi.listTeams(activeOrgId).then(res => setTeams(res.data || [])).catch(() => setTeams([]))
      }
    }
  }, [open, targetOrgId, user?.orgId])

  function reset() {
    setEmail('')
    setRole('')
    setTeamId('')
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

    const activeOrgId = targetOrgId || user?.orgId
    if (!activeOrgId) return setError('Please select an organization before sending an invite.')

    setError('')
    setSubmitting(true)
    try {
      const payload = { email, role }
      if (teamId) payload.teamId = Number(teamId)
      
      await orgApi.inviteMember(activeOrgId, payload)
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

          {teams.length > 0 && (
            <div className="nf-field">
              <label className="nf-label" htmlFor="invite-team">Assign to Team (Optional)</label>
              <select id="invite-team" className="nf-select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                <option value="">None</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <button className="nf-btn nf-btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Sending invite…' : 'Send invite'}
          </button>
        </form>
      )}
    </Modal>
  )
}