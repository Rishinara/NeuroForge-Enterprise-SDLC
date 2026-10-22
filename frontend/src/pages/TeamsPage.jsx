import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { orgApi } from '../api/orgApi.js'
import { adminApi } from '../api/adminApi.js'
import { projectApi } from '../api/projectApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Tabs from '../components/Tabs.jsx'
import InviteMemberModal from '../components/InviteMemberModal.jsx'
import Can from '../components/Can.jsx'
import { User } from 'lucide-react'
import UnassignedOrgNotice from '../components/UnassignedOrgNotice.jsx'
import './workspace.css'
import './teams.css'

const ROLE_LABELS = {
  ORG_ADMIN: 'Org Admin',
  PROJECT_MANAGER: 'Project Manager',
  DEVELOPER: 'Fullstack Developer',
  FRONTEND_DEVELOPER: 'Frontend Developer',
  BACKEND_DEVELOPER: 'Backend Developer',
  QA_TESTER: 'QA / Tester',
  QA: 'QA / Tester',
  CLIENT: 'Client / Stakeholder',
}

const ROLE_DOT = {
  ORG_ADMIN: '#f97316',
  PROJECT_MANAGER: '#3b82f6',
  DEVELOPER: '#0284c7',
  FRONTEND_DEVELOPER: '#6366f1',
  BACKEND_DEVELOPER: '#06b6d4',
  QA_TESTER: '#10b981',
  QA: '#10b981',
  CLIENT: '#a855f7',
}

const EDITABLE_ROLE_OPTIONS = [
  { value: 'PROJECT_MANAGER', label: 'Project Manager' },
  { value: 'FRONTEND_DEVELOPER', label: 'Frontend Developer' },
  { value: 'BACKEND_DEVELOPER', label: 'Backend Developer' },
  { value: 'DEVELOPER', label: 'Fullstack Developer' },
  { value: 'QA_TESTER', label: 'QA / Tester' },
  { value: 'CLIENT', label: 'Client / Stakeholder' },
]

export default function TeamsPage() {
  const { user, role } = useAuth()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN || role === ROLES.SUPER_ADMIN
  const isPM = user?.role === ROLES.PROJECT_MANAGER || role === ROLES.PROJECT_MANAGER

  const [tab, setTab] = useState(() => (isSuperAdmin || isPM ? 'members' : 'teams'))
  const [orgs, setOrgs] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState('ALL')
  const [pmProjects, setPmProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    const cached = localStorage.getItem('neuroforge_current_project_id')
    return cached && !isNaN(Number(cached)) ? Number(cached) : null
  })
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
      } else if (isPM) {
        // Project Manager: only load team members and assigned teams of the selected project
        const projsRes = await projectApi.listProjects(user?.orgId).catch(() => ({ data: [] }))
        const loadedProjects = Array.isArray(projsRes.data) ? projsRes.data : []
        setPmProjects(loadedProjects)

        let targetProjectId = selectedProjectId
        if (!targetProjectId || !loadedProjects.some(p => p.id === targetProjectId)) {
          const cached = localStorage.getItem('neuroforge_current_project_id')
          if (cached && loadedProjects.some(p => String(p.id) === String(cached))) {
            targetProjectId = Number(cached)
          } else if (loadedProjects.length > 0) {
            targetProjectId = loadedProjects[0].id
          }
          if (targetProjectId && targetProjectId !== selectedProjectId) {
            setSelectedProjectId(targetProjectId)
            localStorage.setItem('neuroforge_current_project_id', targetProjectId)
          }
        }

        if (targetProjectId) {
          const [projRes, orgTeamsRes, orgMembersRes] = await Promise.all([
            projectApi.getProject(targetProjectId).catch(() => ({ data: null })),
            orgApi.listTeamsWithMembers(user?.orgId).catch(() => ({ data: [] })),
            orgApi.listMembers(user?.orgId).catch(() => ({ data: [] })),
          ])
          const projData = projRes?.data || {}
          const orgMembersList = Array.isArray(orgMembersRes?.data) ? orgMembersRes.data : []
          const orgMemberMap = new Map(orgMembersList.map((u) => [u.id, u]))
          
          // Only team members of the selected project with correct roles matching Org Admin dashboard
          const projMembers = (projData.team || []).map((m) => {
            const orgUser = orgMemberMap.get(m.id)
            const resolvedRole = orgUser?.role || m.role || (m.projectRole === 'QA' ? 'QA_TESTER' : m.projectRole) || 'DEVELOPER'
            return {
              id: m.id,
              name: orgUser?.fullName || m.fullName || m.name || m.email,
              email: orgUser?.email || m.email,
              role: resolvedRole,
              status: orgUser?.enabled !== false && orgUser?.status !== 'INACTIVE' ? 'ACTIVE' : 'INACTIVE',
              teams: (projData.assignedTeams || []).map((t) => t.name),
            }
          })
          setMembers(projMembers)

          // Only teams assigned to the selected project
          const assignedTeamIds = new Set((projData.assignedTeams || []).map((t) => t.id))
          const allOrgTeams = Array.isArray(orgTeamsRes.data) ? orgTeamsRes.data : []
          const projTeams = allOrgTeams.filter((t) => assignedTeamIds.has(t.id))
          if (projTeams.length === 0 && projData.assignedTeams && projData.assignedTeams.length > 0) {
            setTeams(projData.assignedTeams.map(t => ({ id: t.id, name: t.name, memberCount: projMembers.length })))
          } else {
            setTeams(projTeams)
          }
        } else {
          setMembers([])
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
  }, [isSuperAdmin, isPM, selectedOrgId, user?.orgId, selectedProjectId])

  useEffect(() => {
    load()
  }, [load])

  const targetOrgId = isSuperAdmin ? (selectedOrgId !== 'ALL' ? selectedOrgId : orgs[0]?.id) : user?.orgId
  const currentPmProject = pmProjects.find((p) => p.id === selectedProjectId)

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
      } else if (isPM && selectedProjectId) {
        await projectApi.updateProjectMemberRole(selectedProjectId, memberId, newRole)
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
          <h1 className="wk-page-title">
            {isSuperAdmin
              ? 'Platform Users & Admins'
              : isPM
              ? 'Teams & Members'
              : 'Users, Teams & Members'}
          </h1>
          <p className="wk-page-subtitle">
            {isSuperAdmin
              ? 'Select an organization to manage its platform users and admins.'
              : isPM
              ? `Displaying team members of project: ${currentPmProject?.name || 'Selected Project'}`
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

      {/* Project Selector for Project Manager */}
      {isPM && pmProjects.length > 0 && (
        <div
          className="wk-card"
          style={{
            marginBottom: 20,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Project Scope:
            </span>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => {
                const val = Number(e.target.value)
                setSelectedProjectId(val)
                localStorage.setItem('neuroforge_current_project_id', val)
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {pmProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
            Showing only members and teams belonging to <strong>{currentPmProject?.name || 'this project'}</strong>
          </span>
        </div>
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
          <span className="tm-stat-label">{isPM ? 'Project Members' : 'Total members'}</span>
        </div>
        {!isSuperAdmin && (
          <div className="tm-stat-card">
            <span className="tm-stat-value">{teams.length}</span>
            <span className="tm-stat-label">{isPM ? 'Assigned Teams' : 'Teams'}</span>
          </div>
        )}
        <div className="tm-stat-card">
          <span className="tm-stat-value">
            {(roleCounts.DEVELOPER || 0) + (roleCounts.FRONTEND_DEVELOPER || 0) + (roleCounts.BACKEND_DEVELOPER || 0)}
          </span>
          <span className="tm-stat-label">Developers</span>
        </div>
        <div className="tm-stat-card">
          <span className="tm-stat-value">{(roleCounts.QA_TESTER || 0) + (roleCounts.QA || 0)}</span>
          <span className="tm-stat-label">QA / Testers</span>
        </div>
      </div>

      {!isSuperAdmin && (
        <Tabs
          tabs={[{ key: 'members', label: isPM ? 'Project Members' : 'Members' }, { key: 'teams', label: isPM ? 'Assigned Teams' : 'Teams' }]}
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
            <p className="wk-empty">{isPM ? 'No teams assigned to this project yet.' : 'No teams yet.'}</p>
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
            <p className="wk-empty">
              {isPM ? 'No members assigned to this project match your search.' : 'No members match your search.'}
            </p>
          ) : (
            <div className="tm-member-list">
              {filteredMembers.map((m) => (
                <div key={m.id} className="tm-member-row">
                  <div className="tm-member-identity">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200/90 bg-slate-100 text-slate-600 shadow-2xs">
                      <User size={15} />
                    </div>
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
                      roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER]}
                      fallback={
                        <span className="tm-role-pill" style={{ '--dot': ROLE_DOT[m.role] || '#4b5563' }}>
                          <span className="tm-role-dot" />
                          {ROLE_LABELS[m.role] || m.role}
                        </span>
                      }
                    >
                      {m.id === user?.id || m.role === 'ORG_ADMIN' ? (
                        <span className="tm-role-pill" style={{ '--dot': ROLE_DOT[m.role] || '#4b5563' }}>
                          <span className="tm-role-dot" />
                          {m.role === 'ORG_ADMIN' ? 'Org Admin' : ROLE_LABELS[m.role] || m.role}
                        </span>
                      ) : isPM ? (
                        <span className="tm-role-pill" style={{ '--dot': ROLE_DOT[m.role] || '#4b5563' }}>
                          <span className="tm-role-dot" />
                          {ROLE_LABELS[m.role] || m.role}
                        </span>
                      ) : (
                        <select
                          className="wk-select tm-role-select"
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        >
                          {EDITABLE_ROLE_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      )}
                    </Can>

                    <Can roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
                      {m.id !== user?.id && m.role !== 'ORG_ADMIN' && (
                        <button
                          className="wk-btn tm-btn-danger"
                          onClick={() => handleRemove(m.id)}
                          title="Remove user"
                        >
                          Remove
                        </button>
                      )}
                    </Can>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="wk-modal-overlay">
          <div className="wk-modal" style={{ maxWidth: 440 }}>
            <h2 className="wk-modal-title">Edit Team</h2>
            <form onSubmit={handleUpdateTeam}>
              <div className="wk-form-group">
                <label className="wk-label">Team Name</label>
                <input
                  className="wk-input"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  placeholder="e.g. Frontend Engineers"
                  required
                />
              </div>

              {editingTeam.members && editingTeam.members.length > 0 && (
                <div style={{ marginTop: 15, marginBottom: 15 }}>
                  <label className="wk-label" style={{ marginBottom: 6, display: 'block' }}>Current Members</label>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 8px' }}>
                    {editingTeam.members.map((tm) => (
                      <div key={tm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 13, color: '#334155' }}>{tm.fullName || tm.name || tm.email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMemberFromTeam(tm.id)}
                          style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="wk-modal-actions">
                <button
                  type="button"
                  className="wk-btn"
                  onClick={() => setEditingTeam(null)}
                  disabled={savingEditTeam}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="wk-btn wk-btn-primary"
                  disabled={savingEditTeam}
                >
                  {savingEditTeam ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteOpen && (
        <InviteMemberModal
          orgId={targetOrgId}
          onClose={() => setInviteOpen(false)}
          onSuccess={() => {
            setInviteOpen(false)
            load()
          }}
        />
      )}
    </div>
  )
}