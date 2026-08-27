import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { orgApi } from '../api/orgApi.js'
import { adminApi } from '../api/adminApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import PortalDropdown from '../components/PortalDropdown.jsx'
import UnassignedOrgNotice from '../components/UnassignedOrgNotice.jsx'

const OrgAdminCell = ({ org, orgAdminUser, selectedOrgForAdmin, setSelectedOrgForAdmin, setShowAssignAdminModal, handleRemoveOrgAdmin }) => {
  const triggerRef = useRef(null);
  const isOpen = selectedOrgForAdmin?.id === org.id;

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex items-center gap-1 hover:bg-green-200 transition-colors"
        onClick={() => setSelectedOrgForAdmin((prev) => (prev?.id === org.id ? null : org))}
      >
        <span>✅ Assigned</span>
        <span className="text-[10px]">▼</span>
      </button>
      <PortalDropdown
        isOpen={isOpen}
        onClose={() => setSelectedOrgForAdmin(null)}
        triggerRef={triggerRef}
      >
        <div className="px-3 py-2 border-b border-slate-100">
          <div className="text-[11px] text-slate-500 font-medium">
            Current Admin:
          </div>
          <div className="text-xs font-bold text-slate-900 mt-1 truncate">
            👤 {orgAdminUser.fullName || orgAdminUser.name || orgAdminUser.email}
          </div>
        </div>
        <button
          type="button"
          className="w-full text-left px-3 py-2 text-xs font-medium text-blue-600 hover:bg-slate-50 flex items-center gap-2"
          onClick={() => {
            setSelectedOrgForAdmin(org);
            setShowAssignAdminModal(true);
          }}
        >
          ✏️ Change Org Admin
        </button>
        <button
          type="button"
          className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-slate-50 flex items-center gap-2"
          onClick={() => {
            setSelectedOrgForAdmin(null);
            handleRemoveOrgAdmin(org.id, orgAdminUser.id);
          }}
        >
          🗑️ Remove Org Admin
        </button>
      </PortalDropdown>
    </div>
  );
};

export default function OrganizationsPage() {
  const { user, role } = useAuth()
  const isSuperAdmin = role === ROLES.SUPER_ADMIN || user?.role === ROLES.SUPER_ADMIN

  const [orgs, setOrgs] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgDescription, setNewOrgDescription] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [creatingOrg, setCreatingOrg] = useState(false)
  const [createOrgError, setCreateOrgError] = useState('')
  const [deletingOrgId, setDeletingOrgId] = useState(null)

  const [showAssignAdminModal, setShowAssignAdminModal] = useState(false)
  const [selectedOrgForAdmin, setSelectedOrgForAdmin] = useState(null)
  const [selectedAdminUserId, setSelectedAdminUserId] = useState('')
  const [assignAdminError, setAssignAdminError] = useState('')
  const [assigningAdmin, setAssigningAdmin] = useState(false)

  const loadData = useCallback(async () => {
    if (!isSuperAdmin) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [orgsRes, usersRes] = await Promise.all([
        orgApi.listOrganizations(),
        adminApi.getAllUsers()
      ])
      setOrgs(Array.isArray(orgsRes.data) ? orgsRes.data : [])
      setAllUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCreateOrg(e) {
    e.preventDefault()
    if (!newOrgName.trim() || !supportEmail.trim()) return
    setCreatingOrg(true)
    setCreateOrgError('')
    try {
      await orgApi.createOrganization({
        name: newOrgName.trim(),
        description: newOrgDescription.trim(),
        supportEmail: supportEmail.trim()
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

  async function handleDeleteOrg(org) {
    if (!confirm(`Are you sure you want to completely delete organization "${org.name}"?`)) return
    setError('')
    setDeletingOrgId(org.id)
    try {
      await orgApi.deleteOrganization(org.id)
      loadData()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setDeletingOrgId(null)
    }
  }

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
    if (!confirm("Are you sure you want to remove this user as Org Admin?")) return
    setError('')
    try {
      await orgApi.removeOrgAdmin(orgId, userId)
      loadData()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const filteredOrgs = useMemo(() => {
    if (!searchQuery.trim()) return orgs
    const query = searchQuery.toLowerCase()
    return orgs.filter((org) => org.name.toLowerCase().includes(query))
  }, [orgs, searchQuery])

  if (!isSuperAdmin) {
    return <UnassignedOrgNotice />
  }

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organizations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and monitor organizations within NeuroForge.</p>
        </div>
        <button
          onClick={() => setShowCreateOrgModal(true)}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          + Create Organization
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm shadow-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between gap-4 items-center">
          <div className="relative w-full max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              className="w-full pl-9 pr-4 py-2 text-sm border-slate-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors"
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-slate-500 whitespace-nowrap">
            {filteredOrgs.length} Organization{filteredOrgs.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-12 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="text-center p-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <span className="text-3xl text-slate-400">🏢</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No organizations found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery ? "No organizations match your search." : "Organizations created by the Super Admin will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold text-slate-600 uppercase text-[11px] tracking-wider">ID</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 uppercase text-[11px] tracking-wider">Organization Name</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 uppercase text-[11px] tracking-wider">Description</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 uppercase text-[11px] tracking-wider">Members</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 uppercase text-[11px] tracking-wider text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 uppercase text-[11px] tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrgs.map((org) => {
                  const orgAdminUser = allUsers.find(
                    (u) => (u.role === 'ORG_ADMIN' || u.role === ROLES.ORG_ADMIN) && u.organizationName === org.name
                  )
                  const membersCount = allUsers.filter((u) => u.organizationName === org.name).length

                  return (
                    <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-mono text-xs text-slate-400">#{org.id}</td>
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold uppercase">
                            {org.name.charAt(0)}
                          </div>
                          {org.name}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 truncate max-w-[200px]">{org.description || '—'}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {membersCount} Member{membersCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {orgAdminUser ? (
                          <OrgAdminCell
                            org={org}
                            orgAdminUser={orgAdminUser}
                            selectedOrgForAdmin={selectedOrgForAdmin}
                            setSelectedOrgForAdmin={setSelectedOrgForAdmin}
                            setShowAssignAdminModal={setShowAssignAdminModal}
                            handleRemoveOrgAdmin={handleRemoveOrgAdmin}
                          />
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors"
                            onClick={() => {
                              setSelectedOrgForAdmin(org)
                              setShowAssignAdminModal(true)
                            }}
                          >
                            + Assign Admin
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors"
                          onClick={() => handleDeleteOrg(org)}
                          disabled={deletingOrgId === org.id}
                        >
                          {deletingOrgId === org.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateOrgModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Create Organization
            </h3>
            {createOrgError && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
                {createOrgError}
              </div>
            )}
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Organization Name *
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Acme Corp"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Support Email *
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@acme.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                  value={newOrgDescription}
                  onChange={(e) => setNewOrgDescription(e.target.value)}
                  placeholder="Enterprise Software Engineering Division"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  onClick={() => setShowCreateOrgModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-70"
                  disabled={creatingOrg}
                >
                  {creatingOrg ? "Creating..." : "Create Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignAdminModal && selectedOrgForAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Assign Organization Admin</h2>
              <p className="text-xs text-slate-500 mt-1">For {selectedOrgForAdmin.name}</p>
            </div>
            <form onSubmit={handleAssignAdminSubmit} className="p-6">
              {assignAdminError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{assignAdminError}</div>}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select User</label>
                <select
                  required
                  className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  value={selectedAdminUserId}
                  onChange={(e) => setSelectedAdminUserId(e.target.value)}
                >
                  <option value="">-- Choose a user --</option>
                  {allUsers
                    .filter((u) => u.organizationName === selectedOrgForAdmin.name && u.role !== 'SUPER_ADMIN' && u.role !== 'ORG_ADMIN')
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName || u.name || u.email}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">Only unassigned members belonging to this organization are shown.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setShowAssignAdminModal(false)}>Cancel</button>
                <button type="submit" disabled={assigningAdmin || !selectedAdminUserId} className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-colors disabled:opacity-70">
                  {assigningAdmin ? 'Assigning...' : 'Assign Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
