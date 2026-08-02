import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { IconProjects, IconCheckCircle, IconAlertTriangle, IconClock, IconArrowRight, IconUsers } from '../components/icons.jsx'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { projectApi } from '../api/projectApi.js'
import { orgApi } from '../api/orgApi.js'
import { adminApi } from '../api/adminApi.js'
import { extractErrorMessage } from '../api/client.js'
import Can from '../components/Can.jsx'
import HealthBadge from '../components/HealthBadge.jsx'
import UnassignedOrgNotice from '../components/UnassignedOrgNotice.jsx'
import RecentActivities from '../components/RecentActivities.jsx'
import './dashboard-home.css'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardHome() {
  const { user, role } = useAuth()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN || user?.role === ROLES.SUPER_ADMIN

  // Standard org user state
  const [projects, setProjects] = useState([])
  const [teamsCount, setTeamsCount] = useState(0)
  const [membersCount, setMembersCount] = useState(0)
  
  // Super Admin live state
  const [orgs, setOrgs] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgDescription, setNewOrgDescription] = useState('')
  const [createOrgError, setCreateOrgError] = useState('')
  const [creatingOrg, setCreatingOrg] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isSuperAdmin) {
        const [orgsRes, usersRes] = await Promise.all([
          orgApi.listOrganizations(),
          adminApi.getAllUsers(),
        ])
        const loadedOrgs = Array.isArray(orgsRes.data) ? orgsRes.data : []
        const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : []
        const sortedUsers = [...rawUsers].sort((a, b) => Number(a.id) - Number(b.id))
        setOrgs(loadedOrgs)
        setAllUsers(sortedUsers)

        if (loadedOrgs.length > 0) {
          const projectPromises = loadedOrgs.map((o) =>
            projectApi.listProjects(o.id).catch(() => ({ data: [] }))
          )
          const projectResults = await Promise.all(projectPromises)
          const allProjects = projectResults.flatMap((r) => (Array.isArray(r.data) ? r.data : []))
          setProjects(allProjects)
        } else {
          setProjects([])
        }
      } else {
        const [projRes, teamsRes, membersRes] = await Promise.all([
          projectApi.listProjects(user?.orgId).catch(() => ({ data: [] })),
          orgApi.listTeams(user?.orgId).catch(() => ({ data: [] })),
          orgApi.listMembers(user?.orgId).catch(() => ({ data: [] }))
        ])
        setProjects(Array.isArray(projRes.data) ? projRes.data : [])
        setTeamsCount(Array.isArray(teamsRes.data) ? teamsRes.data.length : 0)
        setMembersCount(Array.isArray(membersRes.data) ? membersRes.data.length : 0)
      }
    } catch (err) {
      setError(extractErrorMessage(err))
      setOrgs([])
      setAllUsers([])
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, user?.orgId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stats = useMemo(() => {
    return {
      totalProjects: projects.length,
      totalTeams: teamsCount,
      totalMembers: membersCount
    }
  }, [projects, teamsCount, membersCount])

  // State for Admin User Management
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ fullName: '', email: '', phoneNumber: '', password: '', role: 'ORG_ADMIN' })
  const [creatingUser, setCreatingUser] = useState(false)
  const [createUserError, setCreateUserError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userActionError, setUserActionError] = useState('')

  async function handleCreateUser(e) {
    e.preventDefault()
    setCreatingUser(true)
    setCreateUserError('')
    try {
      await adminApi.createUser(userForm)
      setUserForm({ fullName: '', email: '', phoneNumber: '', password: '', role: 'ORG_ADMIN' })
      setShowCreateUserModal(false)
      loadData()
    } catch (err) {
      setCreateUserError(extractErrorMessage(err))
    } finally {
      setCreatingUser(false)
    }
  }

  async function handleViewUser(id) {
    setUserActionError('')
    try {
      const res = await adminApi.getUserById(id)
      setSelectedUser(res.data)
    } catch (err) {
      setUserActionError(extractErrorMessage(err))
    }
  }

  async function handleUpdateUserRole(id, newRole) {
    setUserActionError('')
    try {
      await adminApi.updateUserRole(id, newRole)
      loadData()
    } catch (err) {
      setUserActionError(extractErrorMessage(err))
    }
  }

  async function handleDeleteUser(u) {
    if (u.role === ROLES.SUPER_ADMIN || u.role === 'SUPER_ADMIN') {
      setUserActionError('SUPER_ADMIN account cannot be deleted.')
      return
    }
    if (!confirm(`Are you sure you want to delete user "${u.fullName || u.email}"?`)) return
    setUserActionError('')

    // Optimistic UI removal
    const previousUsers = [...allUsers]
    setAllUsers((prev) => prev.filter((item) => item.id !== u.id))

    try {
      await adminApi.deleteUser(u.id)
    } catch (err) {
      setUserActionError(extractErrorMessage(err))
      setAllUsers(previousUsers)
    }
  }

  const [updatingUserId, setUpdatingUserId] = useState(null)

  async function handleToggleUserStatus(u, currentEnabled) {
    if (u.role === ROLES.SUPER_ADMIN || u.role === 'SUPER_ADMIN') {
      setUserActionError('SUPER_ADMIN account cannot be disabled.')
      return
    }
    setUserActionError('')
    setUpdatingUserId(u.id)
    const nextEnabledState = !currentEnabled

    // Optimistic UI update for smooth zero-flicker transition
    setAllUsers((prevUsers) =>
      prevUsers.map((item) =>
        item.id === u.id
          ? { ...item, enabled: nextEnabledState, status: nextEnabledState ? 'ACTIVE' : 'INACTIVE' }
          : item
      )
    )

    try {
      await adminApi.updateUserStatus(u.id, nextEnabledState)
    } catch (err) {
      setUserActionError(extractErrorMessage(err))
      // Rollback on failure
      setAllUsers((prevUsers) =>
        prevUsers.map((item) =>
          item.id === u.id
            ? { ...item, enabled: currentEnabled, status: currentEnabled ? 'ACTIVE' : 'INACTIVE' }
            : item
        )
      )
    } finally {
      setUpdatingUserId(null)
    }
  }

  const [supportEmail, setSupportEmail] = useState('')

  async function handleCreateOrg(e) {
    e.preventDefault()
    if (!newOrgName.trim() || !supportEmail.trim()) return
    setCreatingOrg(true)
    setCreateOrgError('')
    try {
      await orgApi.createOrganization({
        name: newOrgName.trim(),
        description: newOrgDescription.trim(),
        supportEmail: supportEmail.trim(),
      })
      setNewOrgName('')
      setNewOrgDescription('')
      setSupportEmail('')
      setShowCreateOrgModal(false)
      loadData()
    } catch (err) {
      setCreateOrgError(extractErrorMessage(err))
    } finally {
      setCreatingOrg(false)
    }
  }

  // Org Admin Assign State
  const [showAssignAdminModal, setShowAssignAdminModal] = useState(false)
  const [selectedOrgForAdmin, setSelectedOrgForAdmin] = useState(null)
  const [selectedAdminUserId, setSelectedAdminUserId] = useState('')
  const [assignAdminError, setAssignAdminError] = useState('')
  const [assigningAdmin, setAssigningAdmin] = useState(false)

  async function handleAssignAdminSubmit(e) {
    e.preventDefault()
    if (!selectedAdminUserId || !selectedOrgForAdmin) return
    setAssigningAdmin(true)
    setAssignAdminError('')
    try {
      await orgApi.assignOrgAdmin(selectedOrgForAdmin.id, Number(selectedAdminUserId))
      setShowAssignAdminModal(false)
      setSelectedOrgForAdmin(null)
      setSelectedAdminUserId('')
      loadData()
    } catch (err) {
      setAssignAdminError(extractErrorMessage(err))
    } finally {
      setAssigningAdmin(false)
    }
  }

  async function handleRemoveOrgAdmin(orgId, userId) {
    if (!confirm('Are you sure you want to remove this user as Org Admin? Their role will revert to Developer.')) return
    setError('')
    try {
      await orgApi.removeOrgAdmin(orgId, userId)
      loadData()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const userStats = useMemo(() => {
    const active = allUsers.filter((u) => u.enabled !== false && u.status !== 'INACTIVE').length
    const inactive = allUsers.length - active
    return { total: allUsers.length, active, inactive }
  }, [allUsers])

  if (!isSuperAdmin && !user?.orgId) {
    return <UnassignedOrgNotice />
  }

  return (
    <div className="dh-page">
      {/* Hero */}
      <div className="dh-hero">
        <div className="dh-hero-content">
          <p className="dh-hero-eyebrow">{greeting()}</p>
          <h2 className="dh-hero-title">{user?.fullName?.split(' ')[0]}, platform administration.</h2>
          <p className="dh-hero-copy">
            {isSuperAdmin
              ? `Super Admin Overview · ${orgs.length} Organization(s) · ${allUsers.length} Platform User(s)`
              : `${user?.orgName || 'NeuroForge'} · ${stats.total} active project(s)`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isSuperAdmin ? (
            <button
              onClick={() => setShowCreateOrgModal(true)}
              className="dh-hero-cta"
              style={{ background: '#059669', cursor: 'pointer', border: 'none' }}
            >
              + Create Organization
            </button>
          ) : (
            <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN]}>
              <Link to="/projects/new" className="dh-hero-cta">
                New project <IconArrowRight size={14} />
              </Link>
            </Can>
          )}
        </div>
      </div>

      {!isSuperAdmin && (
        <>
          {error && (
            <p className="wk-alert wk-alert-error" style={{ marginBottom: 20 }}>
              {error}
            </p>
          )}
        </>
      )}

      {/* Super Admin Organization Creation Modal */}
      {showCreateOrgModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="wk-card" style={{ maxWidth: 460, width: '100%', margin: 0 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Create Organization</h3>
            {createOrgError && <p className="wk-alert wk-alert-error" style={{ marginBottom: 12 }}>{createOrgError}</p>}
            <form onSubmit={handleCreateOrg}>
              <div className="wk-field">
                <label className="wk-label">Organization Name *</label>
                <input
                  className="wk-input"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div className="wk-field">
                <label className="wk-label">Support Email *</label>
                <input
                  type="email"
                  className="wk-input"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@acme.com"
                  required
                />
              </div>
              <div className="wk-field">
                <label className="wk-label">Description (optional)</label>
                <textarea
                  className="wk-textarea"
                  rows={3}
                  value={newOrgDescription}
                  onChange={(e) => setNewOrgDescription(e.target.value)}
                  placeholder="Enterprise Software Engineering Division"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="wk-btn wk-btn-secondary"
                  style={{ width: 'auto' }}
                  onClick={() => setShowCreateOrgModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="wk-btn wk-btn-primary"
                  style={{ width: 'auto' }}
                  disabled={creatingOrg}
                >
                  {creatingOrg ? 'Creating…' : 'Create Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="dh-stats">
        {isSuperAdmin ? (
          <>
            <div className="dh-stat-card">
              <div className="dh-stat-icon dh-icon-neutral"><IconProjects size={17} /></div>
              <div>
                <div className="dh-stat-value">{orgs.length}</div>
                <div className="dh-stat-label">Total Organizations</div>
              </div>
            </div>
            <div className="dh-stat-card">
              <div className="dh-stat-icon dh-icon-good"><IconCheckCircle size={17} /></div>
              <div>
                <div className="dh-stat-value">{userStats.total}</div>
                <div className="dh-stat-label">Total Users</div>
              </div>
            </div>
            <div className="dh-stat-card">
              <div className="dh-stat-icon dh-icon-good"><IconCheckCircle size={17} /></div>
              <div>
                <div className="dh-stat-value">{userStats.active}</div>
                <div className="dh-stat-label">Active Users</div>
              </div>
            </div>
            <div className="dh-stat-card">
              <div className="dh-stat-icon dh-icon-warn"><IconClock size={17} /></div>
              <div>
                <div className="dh-stat-value">{userStats.inactive}</div>
                <div className="dh-stat-label">Inactive Users</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="dh-stat-card">
              <div className="dh-stat-icon dh-icon-neutral"><IconProjects size={17} /></div>
              <div>
                <div className="dh-stat-value">{stats.totalProjects}</div>
                <div className="dh-stat-label">Total Projects</div>
              </div>
            </div>
            <div className="dh-stat-card">
              <div className="dh-stat-icon dh-icon-good"><IconUsers size={17} /></div>
              <div>
                <div className="dh-stat-value">{stats.totalMembers}</div>
                <div className="dh-stat-label">Total Members</div>
              </div>
            </div>
            <div className="dh-stat-card">
              <div className="dh-stat-icon dh-icon-good"><IconUsers size={17} /></div>
              <div>
                <div className="dh-stat-value">{stats.totalTeams}</div>
                <div className="dh-stat-label">Total Teams</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Super Admin Organizations Section */}
      {isSuperAdmin ? (
        <>
          <div className="dh-card" style={{ marginBottom: 20 }}>
            <div className="dh-card-header">
              <h3 className="dh-card-title">Organizations</h3>
              <span style={{ fontSize: 13, color: '#64748b' }}>{orgs.length} total</span>
            </div>

            {loading ? (
              <p className="dh-empty">Loading organizations…</p>
            ) : orgs.length === 0 ? (
              <p className="dh-empty">No organizations created yet. Click "+ Create Organization" above.</p>
            ) : (
              <table className="wk-table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Organization Name</th>
                    <th>Description</th>
                    <th>Org Admin (Max 1)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org) => {
                    const orgAdminUser = allUsers.find(
                      (u) => u.organizationId === org.id && (u.role === 'ORG_ADMIN' || u.role === ROLES.ORG_ADMIN)
                    ) || allUsers.find(
                      (u) => (u.role === 'ORG_ADMIN' || u.role === ROLES.ORG_ADMIN) && u.organizationName === org.name
                    )

                    return (
                      <tr key={org.id}>
                        <td><code>{org.id}</code></td>
                        <td style={{ fontWeight: 600 }}>{org.name}</td>
                        <td>{org.description || '—'}</td>
                        <td>
                          {orgAdminUser ? (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <button
                                type="button"
                                className="wk-btn"
                                style={{
                                  width: 'auto',
                                  padding: '6px 14px',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: 20,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  transition: 'all 0.15s ease-in-out',
                                }}
                                onClick={() =>
                                  setSelectedOrgForAdmin((prev) => (prev?.id === org.id ? null : org))
                                }
                              >
                                <span>✅ Assigned</span>
                                <span style={{ fontSize: 10 }}>▼</span>
                              </button>

                              {/* Interactive Popover Menu when Assigned Badge is Clicked */}
                              {selectedOrgForAdmin?.id === org.id && !showAssignAdminModal && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '110%',
                                    left: 0,
                                    zIndex: 99,
                                    background: '#ffffff',
                                    borderRadius: 12,
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid #e2e8f0',
                                    padding: '8px 0',
                                    minWidth: 200,
                                  }}
                                >
                                  <div
                                    style={{
                                      padding: '8px 14px',
                                      fontSize: 11,
                                      color: '#64748b',
                                      fontWeight: 600,
                                      borderBottom: '1px solid #f1f5f9',
                                    }}
                                  >
                                    Current Admin:
                                    <div style={{ color: '#0f172a', fontWeight: 700, fontSize: 12, marginTop: 2 }}>
                                      👤 {orgAdminUser.fullName || orgAdminUser.name || orgAdminUser.email}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    style={{
                                      width: '100%',
                                      textAlign: 'left',
                                      padding: '8px 14px',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: '#3b82f6',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                    }}
                                    onClick={() => {
                                      setShowAssignAdminModal(true)
                                    }}
                                  >
                                    ✏️ Change Org Admin
                                  </button>

                                  <button
                                    type="button"
                                    style={{
                                      width: '100%',
                                      textAlign: 'left',
                                      padding: '8px 14px',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: '#ef4444',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                    }}
                                    onClick={() => {
                                      setSelectedOrgForAdmin(null)
                                      handleRemoveOrgAdmin(org.id, orgAdminUser.id)
                                    }}
                                  >
                                    🗑️ Remove Org Admin
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="wk-btn"
                              style={{
                                width: 'auto',
                                padding: '6px 14px',
                                fontSize: 12,
                                fontWeight: 600,
                                background: '#f1f5f9',
                                color: '#475569',
                                border: '1px stroke #cbd5e1',
                                borderRadius: 20,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease-in-out',
                              }}
                              onClick={() => {
                                setSelectedOrgForAdmin(org)
                                setShowAssignAdminModal(true)
                              }}
                            >
                              + Assign Org Admin
                            </button>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="wk-btn"
                            style={{
                              width: 'auto',
                              padding: '4px 10px',
                              fontSize: 11.5,
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease-in-out',
                            }}
                            onClick={() => handleDeleteOrg(org)}
                          >
                            Delete Org
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Super Admin Platform User Management Section */}
          <div className="dh-card">
            <div className="dh-card-header">
              <h3 className="dh-card-title">Platform Users & Admins</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>{allUsers.length} total</span>
                <button
                  onClick={() => setShowCreateUserModal(true)}
                  className="wk-btn wk-btn-primary"
                  style={{ width: 'auto', padding: '6px 14px', fontSize: 13 }}
                >
                  + Create User
                </button>
              </div>
            </div>

            {userActionError && (
              <p className="wk-alert wk-alert-error" style={{ margin: '10px 0' }}>{userActionError}</p>
            )}

            {loading ? (
              <p className="dh-empty">Loading users…</p>
            ) : allUsers.length === 0 ? (
              <p className="dh-empty">No users found on the platform.</p>
            ) : (
              <table className="wk-table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => {
                    const isEnabled = u.enabled !== false && u.status !== 'INACTIVE'
                    const isSuperAdminAccount = u.role === ROLES.SUPER_ADMIN || u.role === 'SUPER_ADMIN'
                    const isUpdatingThisUser = updatingUserId === u.id
                    return (
                      <tr key={u.id}>
                        <td><code>{u.id}</code></td>
                        <td style={{ fontWeight: 600 }}>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontWeight: 600 }}
                            onClick={() => handleViewUser(u.id)}
                          >
                            {u.fullName || u.name || 'User'}
                          </button>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phoneNumber || u.phone || '—'}</td>
                        <td>
                          <select
                            className="wk-select"
                            style={{ padding: '3px 8px', fontSize: 12.5, width: 'auto' }}
                            value={u.role || 'DEVELOPER'}
                            disabled={isSuperAdminAccount || ((u.role === 'ORG_ADMIN' || u.role === ROLES.ORG_ADMIN) && !!u.organizationId)}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            title={
                              (u.role === 'ORG_ADMIN' || u.role === ROLES.ORG_ADMIN) && u.organizationId
                                ? 'Org Admin role for assigned users must be managed via the Organizations table above'
                                : ''
                            }
                          >
                            <option value="SUPER_ADMIN" disabled>Super Admin</option>
                            <option value="ORG_ADMIN" disabled>Org Admin (Assign via Org Table)</option>
                            <option value="PROJECT_MANAGER">Project Manager</option>
                            <option value="DEVELOPER">Developer</option>
                            <option value="QA_TESTER">QA Tester</option>
                            <option value="CLIENT">Client</option>
                          </select>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontSize: 11.5,
                              fontWeight: 600,
                              background: isEnabled ? '#dcfce7' : '#fee2e2',
                              color: isEnabled ? '#166534' : '#991b1b',
                            }}
                          >
                            {isEnabled ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              className="wk-btn"
                              style={{
                                width: 'auto',
                                padding: '4px 10px',
                                fontSize: 11.5,
                                cursor: isSuperAdminAccount || isUpdatingThisUser ? 'not-allowed' : 'pointer',
                                opacity: isSuperAdminAccount || isUpdatingThisUser ? 0.6 : 1,
                                transition: 'all 0.15s ease-in-out',
                              }}
                              disabled={isSuperAdminAccount || isUpdatingThisUser}
                              title={isSuperAdminAccount ? 'SUPER_ADMIN cannot be disabled' : ''}
                              onClick={() => handleToggleUserStatus(u, isEnabled)}
                            >
                              {isUpdatingThisUser ? 'Updating…' : isEnabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              className="wk-btn"
                              style={{
                                width: 'auto',
                                padding: '4px 10px',
                                fontSize: 11.5,
                                background: isSuperAdminAccount ? '#cbd5e1' : '#fee2e2',
                                color: isSuperAdminAccount ? '#64748b' : '#991b1b',
                                border: 'none',
                                cursor: isSuperAdminAccount ? 'not-allowed' : 'pointer',
                                opacity: isSuperAdminAccount ? 0.6 : 1,
                                transition: 'all 0.15s ease-in-out',
                              }}
                              disabled={isSuperAdminAccount}
                              title={isSuperAdminAccount ? 'SUPER_ADMIN cannot be deleted' : ''}
                              onClick={() => handleDeleteUser(u)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Projects List for Standard Users */}
          <div className="dh-card">
            <div className="dh-card-header">
              <h3 className="dh-card-title">
                {role === ROLES.CLIENT ? 'Project progress' : 'Live Projects'}
              </h3>
              <Link to="/projects" className="dh-view-all">
                View all <IconArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <p className="dh-empty">Loading projects…</p>
            ) : projects.length === 0 ? (
              <p className="dh-empty">No projects found.</p>
            ) : (
              <div className="dh-project-list">
                {projects.slice(0, 5).map((p) => (
                  <Link key={p.id} to={`/projects/${p.id}`} className="dh-project-row">
                    <div className="dh-project-main">
                      <span className="dh-project-name">{p.name}</span>
                      <span className="dh-project-meta">{p.methodology}</span>
                    </div>
                    <div className="dh-project-progress-track">
                      <div className="dh-project-progress-fill" style={{ width: `${p.progressPercent ?? 0}%` }} />
                    </div>
                    <span className="dh-project-percent">{p.progressPercent ?? 0}%</span>
                    <HealthBadge status={p.health} />
                  </Link>
                ))}
              </div>
            )}
          </div>
          <RecentActivities />
        </>
      )}

      {/* Create User Modal (POST /api/admin/create-user) */}
      {showCreateUserModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="wk-card" style={{ maxWidth: 460, width: '100%', margin: 0 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Create Platform User</h3>
            {createUserError && <p className="wk-alert wk-alert-error" style={{ marginBottom: 12 }}>{createUserError}</p>}
            <form onSubmit={handleCreateUser}>
              <div className="wk-field">
                <label className="wk-label">Full Name *</label>
                <input
                  className="wk-input"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="wk-field">
                <label className="wk-label">Email *</label>
                <input
                  type="email"
                  className="wk-input"
                  value={userForm.email}
                  onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="wk-field">
                <label className="wk-label">Phone Number * (10-digit Indian mobile)</label>
                <input
                  className="wk-input"
                  value={userForm.phoneNumber}
                  onChange={(e) => setUserForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="9876543210"
                  required
                />
              </div>
              <div className="wk-field">
                <label className="wk-label">Password * (min 8 chars)</label>
                <input
                  type="password"
                  className="wk-input"
                  value={userForm.password}
                  onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="wk-field">
                <label className="wk-label">Role *</label>
                <select
                  className="wk-select"
                  value={userForm.role}
                  onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="ORG_ADMIN">Org Admin</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="QA_TESTER">QA Tester</option>
                  <option value="CLIENT">Client</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="wk-btn wk-btn-secondary"
                  style={{ width: 'auto' }}
                  onClick={() => setShowCreateUserModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="wk-btn wk-btn-primary"
                  style={{ width: 'auto' }}
                  disabled={creatingUser}
                >
                  {creatingUser ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Details Modal (GET /api/admin/users/{id}) */}
      {selectedUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="wk-card" style={{ maxWidth: 460, width: '100%', margin: 0 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>User Details (ID: {selectedUser.id})</h3>
            <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
              <p><strong>Full Name:</strong> {selectedUser.fullName || selectedUser.name || '—'}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {selectedUser.phoneNumber || selectedUser.phone || '—'}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Status:</strong> {selectedUser.enabled !== false ? 'Active' : 'Inactive'}</p>
              {selectedUser.organizationName && <p><strong>Organization:</strong> {selectedUser.organizationName}</p>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="wk-btn wk-btn-secondary"
                style={{ width: 'auto' }}
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Assign Org Admin Modal */}
      {showAssignAdminModal && selectedOrgForAdmin && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="wk-card" style={{ maxWidth: 460, width: '100%', margin: 0 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>Assign Org Admin to {selectedOrgForAdmin.name}</h3>
            {assignAdminError && <p className="wk-alert wk-alert-error" style={{ marginBottom: 12 }}>{assignAdminError}</p>}
            <form onSubmit={handleAssignAdminSubmit}>
              <div className="wk-field">
                <label className="wk-label">Select User to Assign as Org Admin *</label>
                <select
                  className="wk-select"
                  value={selectedAdminUserId}
                  onChange={(e) => setSelectedAdminUserId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a user…</option>
                  {allUsers
                    .filter(
                      (u) =>
                        u.role !== 'SUPER_ADMIN' &&
                        u.role !== ROLES.SUPER_ADMIN &&
                        !u.organizationId &&
                        !u.organizationName
                    )
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.name} ({u.email}) — Current Role: {u.role}
                      </option>
                    ))}
                </select>
                <p style={{ fontSize: 11.5, color: '#64748b', marginTop: 6 }}>
                  Note: Exactly 1 Org Admin is allowed per organization. Assigning this user will grant them full Org Admin control for {selectedOrgForAdmin.name}.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="wk-btn wk-btn-secondary"
                  style={{ width: 'auto' }}
                  onClick={() => {
                    setShowAssignAdminModal(false)
                    setSelectedOrgForAdmin(null)
                    setSelectedAdminUserId('')
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="wk-btn wk-btn-primary"
                  style={{ width: 'auto' }}
                  disabled={assigningAdmin || !selectedAdminUserId}
                >
                  {assigningAdmin ? 'Assigning…' : 'Assign Org Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}