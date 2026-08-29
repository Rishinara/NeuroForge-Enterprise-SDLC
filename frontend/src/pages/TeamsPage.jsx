import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { orgApi } from '../api/orgApi.js'
import { adminApi } from '../api/adminApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Tabs from '../components/Tabs.jsx'
import InviteMemberModal from '../components/InviteMemberModal.jsx'
import Can from '../components/Can.jsx'
import Avatar from '../components/Avatar.jsx'
import UnassignedOrgNotice from '../components/UnassignedOrgNotice.jsx'
import './workspace.css'
import './teams.css'

const ROLE_LABELS = {
  PROJECT_MANAGER: 'Project Manager',
  DEVELOPER: 'Fullstack Developer',
  FRONTEND_DEVELOPER: 'Frontend Developer',
  BACKEND_DEVELOPER: 'Backend Developer',
  QA_TESTER: 'QA / Tester',
  CLIENT: 'Client / Stakeholder',
}

const ROLE_DOT = {
  ORG_ADMIN: '#4f46e5',
  PROJECT_MANAGER: '#4b5563',
  DEVELOPER: '#4b5563',
  FRONTEND_DEVELOPER: '#4b5563',
  BACKEND_DEVELOPER: '#4b5563',
  QA_TESTER: '#4b5563',
  CLIENT: '#9ca3af',
}

export default function TeamsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const [tab, setTab] = useState(() => (isSuperAdmin ? 'members' : 'teams'))
  const [orgs, setOrgs] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState('ALL')
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [search, setSearch] = useState('')
  const [editingTeam, setEditingTeam] = useState(null)
  const [editTeamName, setEditTeamName] = useState('')
  const [savingEditTeam, setSavingEditTeam] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isSuperAdmin) {
        const orgsRes = await orgApi.listOrganizations()
        const loadedOrgs = Array.isArray(orgsRes.data) ? orgsRes.data : []
        setOrgs(loadedOrgs)

        if (selectedOrgId !== 'ALL') {
          const [teamsRes, membersRes] = await Promise.all([
            orgApi.listTeamsWithMembers(selectedOrgId).catch(() => ({ data: [] })),
            orgApi.listMembers(selectedOrgId).catch(() => ({ data: [] }))
          ])
          setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : [])
          setMembers(Array.isArray(membersRes.data) ? membersRes.data : [])
        } else {
          // Fetch all platform users
          const usersRes = await adminApi.getAllUsers()
          const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : []
          setMembers(
            rawUsers
              .filter((u) => u.role !== 'SUPER_ADMIN' && u.role !== ROLES.SUPER_ADMIN)
              .map((u) => ({
                id: u.id,
                name: u.fullName || u.name || u.email,
                email: u.email,
                role: u.role,
                status: u.status || (u.enabled !== false ? 'ACTIVE' : 'INACTIVE'),
              }))
          )
          setTeams([])
        }
      } else if (user?.orgId) {
        const [teamsRes, membersRes] = await Promise.all([
          orgApi.listTeamsWithMembers(user.orgId),
          orgApi.listMembers(user.orgId),
        ])
        setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : [])
        setMembers(Array.isArray(membersRes.data) ? membersRes.data : [])
      } else {
        setTeams([])
        setMembers([])
      }
    } catch (err) {
      setError(extractErrorMessage(err))
      setTeams([])
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, selectedOrgId, user?.orgId])

  useEffect(() => {
    load()
  }, [load])

  const targetOrgId = isSuperAdmin ? (selectedOrgId !== 'ALL' ? selectedOrgId : orgs[0]?.id) : user?.orgId

  async function handleCreateTeam(e) {
    e.preventDefault()
    if (!newTeamName.trim()) return
    const activeOrgId = isSuperAdmin ? (selectedOrgId !== 'ALL' ? selectedOrgId : orgs[0]?.id) : user?.orgId
    if (!activeOrgId) {
      setError('Please select an organization to create a team.')
      return
    }
    setCreatingTeam(true)
    try {
      await orgApi.createTeam(activeOrgId, { name: newTeamName.trim() })
      setNewTeamName('')
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setCreatingTeam(false)
    }
  }
  async function handleUpdateTeam(e) {
    e.preventDefault()
    if (!editTeamName.trim() || !editingTeam) return
    setSavingEditTeam(true)
    const activeOrgId = isSuperAdmin ? (selectedOrgId !== 'ALL' ? selectedOrgId : orgs[0]?.id) : user?.orgId
    try {
      await orgApi.updateTeam(activeOrgId, editingTeam.id, { name: editTeamName.trim() })
      setEditingTeam(null)
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSavingEditTeam(false)
    }
  }

  async function handleRemoveMemberFromTeam(memberId) {
    if (!confirm('Are you sure you want to remove this member from the team?')) return
    const activeOrgId = isSuperAdmin ? (selectedOrgId !== 'ALL' ? selectedOrgId : orgs[0]?.id) : user?.orgId
    try {
      await orgApi.removeTeamMember(activeOrgId, editingTeam.id, memberId)
      setEditingTeam(prev => ({
        ...prev,
        members: prev.members.filter(m => m.id !== memberId)
      }))
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }
  async function handleDeleteTeam(team) {
    if (team.memberCount > 0) {
      setError('Cannot delete a team that still has members.')
      return
    }
    if (!confirm(`Are you sure you want to delete team "${team.name}"?`)) return

    const activeOrgId = isSuperAdmin ? (selectedOrgId !== 'ALL' ? selectedOrgId : orgs[0]?.id) : user?.orgId
    try {
      await orgApi.deleteTeam(activeOrgId, team.id)
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  async function handleRoleChange(memberId, newRole) {
    try {
      if (isSuperAdmin) {
        await adminApi.updateUserRole(memberId, newRole)
      } else {
        await orgApi.updateMemberRole(user.orgId, memberId, newRole)
      }
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  async function handleRemove(memberId) {
    if (!confirm('Remove/Delete this user from the platform?')) return
    try {
      if (isSuperAdmin) {
        await adminApi.deleteUser(memberId)
      } else {
        await orgApi.removeMember(user.orgId, memberId)
      }
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) => {
      const nameVal = (m.fullName || m.name || '').toLowerCase()
      const emailVal = (m.email || '').toLowerCase()
      return nameVal.includes(q) || emailVal.includes(q)
    })
  }, [members, search])

  const roleCounts = useMemo(() => {
    const counts = {}
    for (const m of members) counts[m.role] = (counts[m.role] || 0) + 1
    return counts
  }, [members])

  if (!isSuperAdmin && !user?.orgId) {
    return <UnassignedOrgNotice />
  }

  return (
    <div className="wk-page">
      <div className="wk-page-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="wk-page-title">{isSuperAdmin ? 'Platform Users & Admins' : 'Users, Teams & Members'}</h1>
          <p className="wk-page-subtitle">
            {isSuperAdmin
              ? 'Select an organization to manage its platform users and admins.'
              : `${user?.orgName || 'Organization'} team management`}
          </p>
        </div>
        <Can roles={[ROLES.ORG_ADMIN]}>
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
          {error}
        </p>
      )}

      {/* Organization Selection Filter for Super Admin */}
      {isSuperAdmin && (
        <div className="wk-card" style={{ marginBottom: 20, padding: 16 }}>
          <label className="wk-label" style={{ marginBottom: 8, display: 'block', fontSize: 13.5, fontWeight: 600, color: '#475569' }}>
            Select Organization:
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedOrgId('ALL')}
              className="wk-btn"
              style={{
                width: 'auto',
                padding: '6px 14px',
                fontSize: 12.5,
                borderRadius: 20,
                background: selectedOrgId === 'ALL' ? '#0f172a' : '#f1f5f9',
                color: selectedOrgId === 'ALL' ? '#ffffff' : '#334155',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Organizations ({orgs.length})
            </button>
            {orgs.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => setSelectedOrgId(org.id)}
                className="wk-btn"
                style={{
                  width: 'auto',
                  padding: '6px 14px',
                  fontSize: 12.5,
                  borderRadius: 20,
                  background: selectedOrgId === org.id ? '#4f46e5' : '#f1f5f9',
                  color: selectedOrgId === org.id ? '#ffffff' : '#334155',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🏢 {org.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stat summary row */}
      <div className="tm-stats">
        <div className="tm-stat-card">
          <span className="tm-stat-value">{members.length}</span>
          <span className="tm-stat-label">Total members</span>
        </div>
        {!isSuperAdmin && (
          <div className="tm-stat-card">
            <span className="tm-stat-value">{teams.length}</span>
            <span className="tm-stat-label">Teams</span>
          </div>
        )}
        <div className="tm-stat-card">
          <span className="tm-stat-value">{roleCounts.DEVELOPER || 0}</span>
          <span className="tm-stat-label">Developers</span>
        </div>
        <div className="tm-stat-card">
          <span className="tm-stat-value">{roleCounts.QA_TESTER || 0}</span>
          <span className="tm-stat-label">QA / Testers</span>
        </div>
      </div>

      {!isSuperAdmin && (
        <Tabs
          tabs={[{ key: 'teams', label: 'Teams' }, { key: 'members', label: 'Members' }]}
          active={tab}
          onChange={setTab}
        />
      )}

      {loading ? (
        <p className="wk-empty">Loading…</p>
      ) : tab === 'teams' ? (
        <>
          <Can roles={[ROLES.ORG_ADMIN]}>
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
                  <div className="tm-team-info-group">
                    <div className="tm-team-icon">{t.name.charAt(0).toUpperCase()}</div>
                    <div className="tm-team-details">
                      <div className="tm-team-name">
                        <Link to={`/org/teams/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }} title={t.name}>
                          {t.name}
                        </Link>
                      </div>
                      <div className="tm-team-count">{t.memberCount} member{t.memberCount === 1 ? '' : 's'}</div>
                    </div>
                  </div>
                  <Can roles={[ROLES.ORG_ADMIN]}>
                    <div className="tm-team-actions">
                      <button
                        className="tm-team-btn tm-team-btn-edit"
                        onClick={() => {
                          setEditingTeam(t)
                          setEditTeamName(t.name)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="tm-team-btn tm-team-btn-delete"
                        onClick={() => handleDeleteTeam(t)}
                      >
                        Delete
                      </button>
                    </div>
                  </Can>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="wk-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="tm-member-toolbar">
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
                      {m.teams && m.teams.length > 0 && (
                        <div className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                          Teams: <span className="font-semibold text-slate-700 dark:text-slate-300">{m.teams.join(', ')}</span>
                        </div>
                      )}
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
                      {m.id === user?.id || m.role === 'ORG_ADMIN' ? (
                        <span className="tm-role-pill" style={{ '--dot': ROLE_DOT[m.role] }}>
                          <span className="tm-role-dot" />
                          {m.role === 'ORG_ADMIN' ? 'Org Admin' : ROLE_LABELS[m.role]}
                        </span>
                      ) : (
                        <select
                          className="wk-select tm-role-select"
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      )}
                    </Can>
                  </div>

                  <Can roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
                    {m.id !== user?.id && m.role !== 'ORG_ADMIN' && (
                      <button className="tm-remove-btn" onClick={() => handleRemove(m.id)}>
                        Remove
                      </button>
                    )}
                  </Can>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={load}
        targetOrgId={targetOrgId}
      />

      {editingTeam && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Edit Team Name
            </h3>
            <form onSubmit={handleUpdateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Team Name
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  placeholder="e.g. Platform Engineering"
                  required
                />
              </div>

              {/* Team Members List */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Team Members ({editingTeam.members?.length || 0})
                </label>
                {!editingTeam.members || editingTeam.members.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No members in this team.</p>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700 max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-2">
                    {editingTeam.members.map((m) => (
                      <div key={m.id} className="flex justify-between items-center py-2 text-sm text-slate-700 dark:text-slate-300">
                        <span>{m.fullName || m.name} ({m.email})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMemberFromTeam(m.id)}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => setEditingTeam(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-75"
                  disabled={savingEditTeam}
                >
                  {savingEditTeam ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}