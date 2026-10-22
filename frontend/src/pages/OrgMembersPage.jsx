import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  IconUsers,
  IconCheckCircle,
  IconClock,
  IconArrowRight,
} from '../components/icons.jsx'
import { UserPlus, Shield, User, Mail, Phone, Calendar, RefreshCw, X, AlertCircle } from 'lucide-react'
import { orgApi } from '../api/orgApi.js'
import { adminApi } from '../api/adminApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import InviteMemberModal from '../components/InviteMemberModal.jsx'
import Modal from '../components/Modal.jsx'

const ROLE_OPTIONS = [
  { value: ROLES.PROJECT_MANAGER, label: 'Project Manager', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: ROLES.FRONTEND_DEVELOPER, label: 'Frontend Developer', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: ROLES.BACKEND_DEVELOPER, label: 'Backend Developer', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: ROLES.DEVELOPER, label: 'Fullstack Developer', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: ROLES.QA_TESTER, label: 'QA / Tester', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: ROLES.CLIENT, label: 'Client / Stakeholder', color: 'bg-purple-50 text-purple-700 border-purple-200' },
]

function formatEnum(val) {
  if (!val) return ''
  return val
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getRoleBadgeColor(role) {
  switch (role) {
    case 'ORG_ADMIN':
    case ROLES.ORG_ADMIN:
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'PROJECT_MANAGER':
    case ROLES.PROJECT_MANAGER:
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'DEVELOPER':
    case ROLES.DEVELOPER:
      return 'bg-sky-50 text-sky-700 border-sky-200'
    case 'FRONTEND_DEVELOPER':
    case ROLES.FRONTEND_DEVELOPER:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'BACKEND_DEVELOPER':
    case ROLES.BACKEND_DEVELOPER:
      return 'bg-cyan-50 text-cyan-700 border-cyan-200'
    case 'QA_TESTER':
    case ROLES.QA_TESTER:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'CLIENT':
    case ROLES.CLIENT:
      return 'bg-purple-50 text-purple-700 border-purple-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export default function OrgMembersPage() {
  const { user, role } = useAuth()
  const isOrgAdmin = role === ROLES.ORG_ADMIN || user?.role === ROLES.ORG_ADMIN
  const isSuperAdmin = role === ROLES.SUPER_ADMIN || user?.role === ROLES.SUPER_ADMIN
  const activeOrgId = user?.orgId

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [updatingUserId, setUpdatingUserId] = useState(null)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  // Edit Role Modal state
  const [roleModalMember, setRoleModalMember] = useState(null)
  const [selectedNewRole, setSelectedNewRole] = useState('')
  const [savingRole, setSavingRole] = useState(false)

  // View Member Detail Modal state
  const [viewingMember, setViewingMember] = useState(null)

  const loadMembers = useCallback(async () => {
    if (!activeOrgId && !isSuperAdmin) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      if (activeOrgId) {
        const res = await orgApi.listMembers(activeOrgId)
        setMembers(Array.isArray(res.data) ? res.data : [])
      } else if (isSuperAdmin) {
        const res = await adminApi.getAllUsers()
        const rawUsers = Array.isArray(res.data) ? res.data : []
        setMembers(
          rawUsers
            .filter((u) => u.role !== 'SUPER_ADMIN' && u.role !== ROLES.SUPER_ADMIN)
            .map((u) => ({
              id: u.id,
              fullName: u.fullName || u.name || u.email,
              email: u.email,
              role: u.role,
              enabled: u.enabled !== false && u.status !== 'INACTIVE',
              teams: [],
              joinedAt: u.createdAt,
            }))
        )
      }
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [activeOrgId, isSuperAdmin])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const stats = useMemo(() => {
    const total = members.length
    const active = members.filter((m) => m.enabled !== false && m.status !== 'INACTIVE').length
    const inactive = total - active
    return { total, active, inactive }
  }, [members])

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const nameMatch = (m.fullName || m.name || '').toLowerCase().includes(q)
        const emailMatch = (m.email || '').toLowerCase().includes(q)
        const roleMatch = (m.role || '').toLowerCase().includes(q)
        const teamMatch = Array.isArray(m.teams) && m.teams.some((t) => t.toLowerCase().includes(q))
        if (!nameMatch && !emailMatch && !roleMatch && !teamMatch) return false
      }

      // Role filter
      if (roleFilter !== 'ALL' && m.role !== roleFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const isEnabled = m.enabled !== false && m.status !== 'INACTIVE'
        if (statusFilter === 'ACTIVE' && !isEnabled) return false
        if (statusFilter === 'INACTIVE' && isEnabled) return false
      }

      return true
    })
  }, [members, searchQuery, roleFilter, statusFilter])

  async function handleToggleStatus(m, currentStatus) {
    setActionError('')
    setUpdatingUserId(m.id)
    try {
      await adminApi.updateUserStatus(m.id, !currentStatus)
      setMembers((prev) =>
        prev.map((item) =>
          item.id === m.id ? { ...item, enabled: !currentStatus } : item
        )
      )
    } catch (err) {
      setActionError(extractErrorMessage(err))
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function handleOpenRoleModal(m) {
    setActionError('')
    setRoleModalMember(m)
    setSelectedNewRole(m.role || ROLES.DEVELOPER)
  }

  async function handleSaveRole(e) {
    e.preventDefault()
    if (!roleModalMember || !selectedNewRole) return
    setSavingRole(true)
    setActionError('')
    try {
      if (activeOrgId) {
        await orgApi.updateMemberRole(activeOrgId, roleModalMember.id, selectedNewRole)
      } else {
        await adminApi.updateUserRole(roleModalMember.id, selectedNewRole)
      }
      setMembers((prev) =>
        prev.map((item) =>
          item.id === roleModalMember.id ? { ...item, role: selectedNewRole } : item
        )
      )
      setRoleModalMember(null)
    } catch (err) {
      setActionError(extractErrorMessage(err))
    } finally {
      setSavingRole(false)
    }
  }

  async function handleRemoveMember(m) {
    if (m.id === user?.id || m.email === user?.email) {
      setActionError('You cannot remove yourself from the organization.')
      return
    }
    if (m.role === 'ORG_ADMIN' || m.role === ROLES.ORG_ADMIN) {
      setActionError('Organization Administrators cannot be removed from this view.')
      return
    }

    if (!confirm(`Are you sure you want to remove "${m.fullName || m.email}" from the organization?`)) {
      return
    }

    setActionError('')
    setUpdatingUserId(m.id)
    const prevList = members
    setMembers((prev) => prev.filter((item) => item.id !== m.id))
    try {
      if (activeOrgId) {
        await orgApi.removeMember(activeOrgId, m.id)
      } else {
        await adminApi.deleteUser(m.id)
      }
    } catch (err) {
      setMembers(prevList)
      setActionError(extractErrorMessage(err))
    } finally {
      setUpdatingUserId(null)
    }
  }

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Organization Management
          </p>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">
              Organization Members
            </h2>
            {user?.orgName && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                🏢 {user.orgName}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-700 mt-1">
            Manage your organization's team members, roles, assigned projects, and system access.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadMembers}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link
            to="/org/invites"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Mail size={14} className="text-slate-500" />
            <span>Pending Invites</span>
          </Link>
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
            <span>Total Members</span>
            <IconUsers className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {stats.total}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
            <span>Active Members</span>
            <IconCheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {stats.active}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
            <span>Inactive Members</span>
            <IconClock className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {stats.inactive}
          </div>
        </div>
      </div>

      {/* Members Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <IconUsers className="w-5 h-5 text-orange-500" />
              Members List
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing active team members with assigned roles and teams in {user?.orgName || 'your organization'}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name, email, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-56"
            />

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value={ROLES.ORG_ADMIN}>Org Admin</option>
              <option value={ROLES.PROJECT_MANAGER}>Project Manager</option>
              <option value={ROLES.DEVELOPER}>Fullstack Developer</option>
              <option value={ROLES.FRONTEND_DEVELOPER}>Frontend Developer</option>
              <option value={ROLES.BACKEND_DEVELOPER}>Backend Developer</option>
              <option value={ROLES.QA_TESTER}>QA / Tester</option>
              <option value={ROLES.CLIENT}>Client / Stakeholder</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <span className="text-xs font-semibold px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full whitespace-nowrap">
              {filteredMembers.length} Member{filteredMembers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <IconUsers className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <IconUsers className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">
              {searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No organization members match your search criteria'
                : 'No members in this organization yet'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Invite team members or approve pending join requests to grow your organization.
            </p>
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="mt-4 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              + Invite First Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs font-medium text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="pb-3 px-2">Member</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2">Teams</th>
                  <th className="pb-3 px-2">Active Projects</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Joined</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((m) => {
                  const isEnabled = m.enabled !== false && m.status !== 'INACTIVE'
                  const isUpdating = updatingUserId === m.id
                  const isSelf = m.id === user?.id || m.email === user?.email
                  const isOrgAdminUser = m.role === 'ORG_ADMIN' || m.role === ROLES.ORG_ADMIN

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      {/* Member Info */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-2xs ${
                              isOrgAdminUser
                                ? 'bg-orange-50 border-orange-200 text-orange-600'
                                : 'bg-slate-100 border-slate-200/90 text-slate-600'
                            }`}
                            title={m.fullName || m.name || m.email}
                          >
                            {isOrgAdminUser ? <Shield size={15} /> : <User size={15} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                className="font-semibold text-slate-900 hover:text-orange-600 hover:underline text-left truncate cursor-pointer"
                                onClick={() => setViewingMember(m)}
                              >
                                {m.fullName || m.name || 'Member'}
                              </button>
                              {isSelf && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{m.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getRoleBadgeColor(
                            m.role
                          )}`}
                        >
                          {isOrgAdminUser && <Shield size={12} className="text-orange-600" />}
                          {formatEnum(m.role)}
                        </span>
                      </td>

                      {/* Teams */}
                      <td className="py-3 px-2">
                        {Array.isArray(m.teams) && m.teams.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {m.teams.map((t, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No team</span>
                        )}
                      </td>

                      {/* Active Projects */}
                      <td className="py-3 px-2">
                        {m.assignedProjectName ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            📁 {m.assignedProjectName}
                          </span>
                        ) : m.activeProjectCount && m.activeProjectCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {m.activeProjectCount} Project{m.activeProjectCount !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Available</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            isEnabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isEnabled ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-2 text-xs text-slate-500 whitespace-nowrap">
                        {m.joinedAt
                          ? new Date(m.joinedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {!isOrgAdminUser && !isSelf && (
                            <>
                              <button
                                type="button"
                                className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors cursor-pointer"
                                onClick={() => handleOpenRoleModal(m)}
                              >
                                Edit Role
                              </button>
                              <button
                                type="button"
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                                disabled={isUpdating}
                                onClick={() => handleToggleStatus(m, isEnabled)}
                              >
                                {isEnabled ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
                                disabled={isUpdating}
                                onClick={() => handleRemoveMember(m)}
                              >
                                Remove
                              </button>
                            </>
                          )}
                          {(isOrgAdminUser || isSelf) && (
                            <button
                              type="button"
                              className="px-2.5 py-1 text-xs font-medium rounded-md text-slate-500 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                              onClick={() => setViewingMember(m)}
                            >
                              View Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {roleModalMember && (
        <Modal
          open={Boolean(roleModalMember)}
          onClose={() => setRoleModalMember(null)}
          title={`Update Role: ${roleModalMember.fullName || roleModalMember.email}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveRole} className="space-y-4">
            <p className="text-xs text-slate-500">
              Select the new functional role for this member within <strong>{user?.orgName || 'the organization'}</strong>.
            </p>

            <div className="space-y-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedNewRole === opt.value
                      ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="selectedRole"
                      value={opt.value}
                      checked={selectedNewRole === opt.value}
                      onChange={(e) => setSelectedNewRole(e.target.value)}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-slate-800">{opt.label}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${opt.color}`}>
                    {formatEnum(opt.value)}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => setRoleModalMember(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingRole}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingRole ? 'Saving...' : 'Update Role'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Member Details Modal */}
      {viewingMember && (
        <Modal
          open={Boolean(viewingMember)}
          onClose={() => setViewingMember(null)}
          title="Member Details"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border shadow-2xs ${
                  viewingMember.role === 'ORG_ADMIN' || viewingMember.role === ROLES.ORG_ADMIN
                    ? 'bg-orange-50 border-orange-200 text-orange-600'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {viewingMember.role === 'ORG_ADMIN' || viewingMember.role === ROLES.ORG_ADMIN ? (
                  <Shield size={22} />
                ) : (
                  <User size={22} />
                )}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {viewingMember.fullName || viewingMember.name || 'Member'}
                </h4>
                <p className="text-xs text-slate-500">{viewingMember.email}</p>
                <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${getRoleBadgeColor(viewingMember.role)}`}>
                  {formatEnum(viewingMember.role)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium block mb-1">Status</span>
                <span className={`font-semibold ${viewingMember.enabled !== false ? 'text-green-600' : 'text-red-600'}`}>
                  {viewingMember.enabled !== false ? 'Active Account' : 'Inactive'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-medium block mb-1">Organization</span>
                <span className="font-semibold text-slate-800">
                  {user?.orgName || 'Current Org'}
                </span>
              </div>
            </div>

            {Array.isArray(viewingMember.teams) && viewingMember.teams.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-400 font-medium block mb-1.5">Assigned Teams</span>
                <div className="flex flex-wrap gap-1">
                  {viewingMember.teams.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-xs rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {viewingMember.joinedAt && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar size={14} />
                <span>Joined on {new Date(viewingMember.joinedAt).toLocaleDateString()}</span>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => setViewingMember(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        targetOrgId={activeOrgId}
        onInvited={() => {
          loadMembers()
        }}
      />
    </div>
  )
}
