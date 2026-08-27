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
    <Modal open={open} onClose={handleClose} title="Invite Team Member" maxWidth="max-w-md">
      {sent ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-sm flex items-start gap-2.5">
            <span className="text-base leading-none">✓</span>
            <div>
              <p className="font-semibold mb-0.5">Invitation Sent</p>
              <p className="text-xs text-emerald-600">
                An invitation email has been sent to <strong>{email}</strong>. They will receive instructions to activate their account.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-all shadow-xs active:scale-[0.98]"
            onClick={handleClose}
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="invite-email">
              Email address <span className="text-orange-500">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none placeholder:text-slate-400 transition-all shadow-2xs"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="invite-role">
              Role <span className="text-orange-500">*</span>
            </label>
            <select
              id="invite-role"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs cursor-pointer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="" disabled>Select a platform role…</option>
              {INVITE_ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {teams.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="invite-team">
                Assign to Team (Optional)
              </label>
              <select
                id="invite-team"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs cursor-pointer"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              >
                <option value="">None (Org level only)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all active:scale-[0.98]"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending…</span>
                </>
              ) : (
                'Send Invite'
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}