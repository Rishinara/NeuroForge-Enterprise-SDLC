import { useState, useEffect, useCallback } from 'react'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Tabs from '../components/Tabs.jsx'
import InviteMemberModal from '../components/InviteMemberModal.jsx'
import Can from '../components/Can.jsx'
import './workspace.css'

const ROLE_LABELS = {
  ORG_ADMIN: 'Org Admin',
  PROJECT_MANAGER: 'Project Manager',
  DEVELOPER: 'Developer',
  QA_TESTER: 'QA / Tester',
  CLIENT: 'Client / Stakeholder',
}

export default function TeamsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('teams')
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [teamsRes, membersRes] = await Promise.all([
        orgApi.listTeams(user.orgId),
        orgApi.listMembers(user.orgId),
      ])
      setTeams(teamsRes.data)
      setMembers(membersRes.data)
    } catch (err) {
      setError(extractErrorMessage(err))
      // Fallback sample data so the page is demoable without a live backend
      setTeams([
        { id: 't1', name: 'Platform Engineering', memberCount: 6 },
        { id: 't2', name: 'Mobile', memberCount: 4 },
      ])
      setMembers([
        { id: 'm1', name: 'Asha Patel', email: 'asha@company.com', role: 'PROJECT_MANAGER' },
        { id: 'm2', name: 'Leo Kim', email: 'leo@company.com', role: 'DEVELOPER' },
        { id: 'm3', name: 'Maya Chen', email: 'maya@company.com', role: 'QA_TESTER' },
      ])
    } finally {
      setLoading(false)
    }
  }, [user.orgId])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreateTeam(e) {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setCreatingTeam(true)
    try {
      await orgApi.createTeam(user.orgId, { name: newTeamName.trim() })
      setNewTeamName('')
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setCreatingTeam(false)
    }
  }

  async function handleRoleChange(memberId, newRole) {
    try {
      await orgApi.updateMemberRole(user.orgId, memberId, newRole)
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  async function handleRemove(memberId) {
    if (!confirm('Remove this member from the organization?')) return
    try {
      await orgApi.removeMember(user.orgId, memberId)
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div className="wk-page">
      <div className="wk-page-header">
        <div>
          <h1 className="wk-page-title">Teams & Members</h1>
          <p className="wk-page-subtitle">{user.orgName}</p>
        </div>
        <Can roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
          <button className="nf-btn nf-btn-primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={() => setInviteOpen(true)}>
            Invite member
          </button>
        </Can>
      </div>

      {error && <p className="nf-alert nf-alert-error">{error}</p>}

      <Tabs
        tabs={[{ key: 'teams', label: 'Teams' }, { key: 'members', label: 'Members' }]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <p className="wk-empty">Loading…</p>
      ) : tab === 'teams' ? (
        <div className="wk-card">
          <Can roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
            <form onSubmit={handleCreateTeam} className="wk-inline-form">
              <input
                className="nf-input"
                placeholder="New team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
              <button className="nf-btn nf-btn-primary" style={{ width: 'auto' }} disabled={creatingTeam}>
                {creatingTeam ? 'Creating…' : 'Create team'}
              </button>
            </form>
          </Can>

          <table className="wk-table">
            <thead>
              <tr><th>Team</th><th>Members</th></tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.memberCount}</td>
                </tr>
              ))}
              {teams.length === 0 && <tr><td colSpan={2} className="wk-empty">No teams yet.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="wk-card">
          <table className="wk-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><Can roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}><th></th></Can></tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.email}</td>
                  <td>
                    <Can
                      roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}
                      fallback={<span className="wk-badge">{ROLE_LABELS[m.role]}</span>}
                    >
                      <select className="nf-select" value={m.role} onChange={(e) => handleRoleChange(m.id, e.target.value)}>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </Can>
                  </td>
                  <Can roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
                    <td>
                      <button className="nf-btn-text-danger" onClick={() => handleRemove(m.id)}>Remove</button>
                    </td>
                  </Can>
                </tr>
              ))}
              {members.length === 0 && <tr><td colSpan={4} className="wk-empty">No members yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={load} />
    </div>
  )
}