import { useState, useEffect, useCallback, useMemo } from 'react'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Tabs from '../components/Tabs.jsx'
import InviteMemberModal from '../components/InviteMemberModal.jsx'
import Can from '../components/Can.jsx'
import Avatar from '../components/Avatar.jsx'
import './workspace.css'
import './teams.css'

const ROLE_LABELS = {
  ORG_ADMIN: 'Org Admin',
  PROJECT_MANAGER: 'Project Manager',
  DEVELOPER: 'Developer',
  QA_TESTER: 'QA / Tester',
  CLIENT: 'Client / Stakeholder',
}

const ROLE_DOT = {
  ORG_ADMIN: '#4f46e5',
  PROJECT_MANAGER: '#4b5563',
  DEVELOPER: '#4b5563',
  QA_TESTER: '#4b5563',
  CLIENT: '#9ca3af',
}

const SAMPLE_TEAMS = [
  { id: 't1', name: 'Platform Engineering', memberCount: 6 },
  { id: 't2', name: 'Mobile', memberCount: 4 },
  { id: 't3', name: 'QA & Release', memberCount: 3 },
]

const SAMPLE_MEMBERS = [
  { id: 'm1', name: 'Asha Patel', email: 'asha@company.com', role: 'PROJECT_MANAGER' },
  { id: 'm2', name: 'Leo Kim', email: 'leo@company.com', role: 'DEVELOPER' },
  { id: 'm3', name: 'Maya Chen', email: 'maya@company.com', role: 'QA_TESTER' },
  { id: 'm4', name: 'Priya Nair', email: 'priya@company.com', role: 'DEVELOPER' },
  { id: 'm5', name: 'Sam Torres', email: 'sam@company.com', role: 'CLIENT' },
]

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
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [teamsRes, membersRes] = await Promise.all([
        orgApi.listTeams(user.orgId),
        orgApi.listMembers(user.orgId),
      ])
      const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : null
      const membersData = Array.isArray(membersRes.data) ? membersRes.data : null

      if (!teamsData || !membersData) {
        throw new Error('Unexpected response shape from server')
      }
      setTeams(teamsData)
      setMembers(membersData)
    } catch (err) {
      setError(extractErrorMessage(err))
      // Sample data so the page is fully demoable without a live backend
      setTeams(SAMPLE_TEAMS)
      setMembers(SAMPLE_MEMBERS)
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

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    )
  }, [members, search])

  const roleCounts = useMemo(() => {
    const counts = {}
    for (const m of members) counts[m.role] = (counts[m.role] || 0) + 1
    return counts
  }, [members])

  return (
    <div className="wk-page">
      <div className="wk-page-header" style={{ justifyContent: 'flex-end' }}>
        <Can roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
          <button
            className="wk-btn wk-btn-primary"
            style={{ width: 'auto', padding: '10px 18px' }}
            onClick={() => setInviteOpen(true)}
          >
            + Invite member
          </button>
        </Can>
      </div>

      {error && (
        <p className="wk-alert wk-alert-error">
          Live data unavailable — showing sample data instead. ({error})
        </p>
      )}

      {/* Stat summary row */}
      <div className="tm-stats">
        <div className="tm-stat-card">
          <span className="tm-stat-value">{members.length}</span>
          <span className="tm-stat-label">Total members</span>
        </div>
        <div className="tm-stat-card">
          <span className="tm-stat-value">{teams.length}</span>
          <span className="tm-stat-label">Teams</span>
        </div>
        <div className="tm-stat-card">
          <span className="tm-stat-value">{roleCounts.DEVELOPER || 0}</span>
          <span className="tm-stat-label">Developers</span>
        </div>
        <div className="tm-stat-card">
          <span className="tm-stat-value">{roleCounts.QA_TESTER || 0}</span>
          <span className="tm-stat-label">QA / Testers</span>
        </div>
      </div>

      <Tabs
        tabs={[{ key: 'teams', label: 'Teams' }, { key: 'members', label: 'Members' }]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <p className="wk-empty">Loading…</p>
      ) : tab === 'teams' ? (
        <>
          <Can roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
            <form onSubmit={handleCreateTeam} className="tm-inline-form">
              <input
                className="wk-input"
                placeholder="New team name, e.g. Platform Engineering"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
              <button className="wk-btn wk-btn-primary" style={{ width: 'auto', padding: '11px 18px' }} disabled={creatingTeam}>
                {creatingTeam ? 'Creating…' : 'Create team'}
              </button>
            </form>
          </Can>

          {teams.length === 0 ? (
            <p className="wk-empty">No teams yet.</p>
          ) : (
            <div className="tm-team-grid">
              {teams.map((t) => (
                <div key={t.id} className="tm-team-card">
                  <div className="tm-team-icon">{t.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="tm-team-name">{t.name}</div>
                    <div className="tm-team-count">{t.memberCount} member{t.memberCount === 1 ? '' : 's'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="wk-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="tm-member-toolbar">
            <p className="wk-eyebrow" style={{ marginBottom: 10 }}>Organization</p>
            <input
              className="wk-input"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 260 }}
            />
          </div>

          {filteredMembers.length === 0 ? (
            <p className="wk-empty">No members match your search.</p>
          ) : (
            <div className="tm-member-list">
              {filteredMembers.map((m) => (
                <div key={m.id} className="tm-member-row">
                  <div className="tm-member-identity">
                    <Avatar name={m.name} />
                    <div>
                      <div className="tm-member-name">{m.name}</div>
                      <div className="tm-member-email">{m.email}</div>
                    </div>
                  </div>

                  <div className="tm-member-role">
                    <Can
                      roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}
                      fallback={
                        <span className="tm-role-pill" style={{ '--dot': ROLE_DOT[m.role] }}>
                          <span className="tm-role-dot" />
                          {ROLE_LABELS[m.role]}
                        </span>
                      }
                    >
                      <select
                        className="wk-select tm-role-select"
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      >
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </Can>
                  </div>

                  <Can roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
                    <button className="tm-remove-btn" onClick={() => handleRemove(m.id)}>
                      Remove
                    </button>
                  </Can>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={load} />
    </div>
  )
}