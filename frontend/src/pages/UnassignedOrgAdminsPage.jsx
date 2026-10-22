import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  IconUsers,
  IconCheckCircle,
  IconClock,
  IconArrowRight,
  IconProjects,
} from '../components/icons.jsx';
import { adminApi } from '../api/adminApi.js';
import { orgApi } from '../api/orgApi.js';
import { extractErrorMessage } from '../api/client.js';
import { useAuth, ROLES } from '../context/AuthContext.jsx';

function formatEnum(val) {
  if (!val) return '';
  return val
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function UnassignedOrgAdminsPage() {
  const { user, role } = useAuth();
  const isSuperAdmin = role === ROLES.SUPER_ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const [allUsers, setAllUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Assign organization modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetAdmin, setTargetAdmin] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  // User details modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActionError, setUserActionError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, orgsRes] = await Promise.all([
        adminApi.getAllUsers(),
        orgApi.listOrganizations().catch(() => ({ data: [] })),
      ]);
      const loadedUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
      const loadedOrgs = Array.isArray(orgsRes.data) ? orgsRes.data : [];
      setAllUsers(loadedUsers);
      setOrgs(loadedOrgs);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin, loadData]);

  // Filter ONLY unassigned Org Admins (newly registered without an organization)
  const unassignedOrgAdmins = useMemo(() => {
    return allUsers.filter((u) => {
      const isOrgAdmin = u.role === 'ORG_ADMIN' || u.role === ROLES.ORG_ADMIN;
      const isUnassigned = !u.organizationId && !u.organizationName && !u.orgId;
      return isOrgAdmin && isUnassigned;
    });
  }, [allUsers]);

  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return unassignedOrgAdmins;
    const q = searchQuery.toLowerCase();
    return unassignedOrgAdmins.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phoneNumber?.toLowerCase().includes(q)
    );
  }, [unassignedOrgAdmins, searchQuery]);

  const stats = useMemo(() => {
    const total = unassignedOrgAdmins.length;
    const active = unassignedOrgAdmins.filter(
      (u) => u.enabled !== false && u.status !== 'INACTIVE'
    ).length;
    const inactive = total - active;
    return { total, active, inactive, orgsCount: orgs.length };
  }, [unassignedOrgAdmins, orgs]);

  function handleOpenAssignModal(adminUser) {
    setTargetAdmin(adminUser);
    setSelectedOrgId('');
    setAssignError('');
    setAssignSuccess('');
    setShowAssignModal(true);
  }

  async function handleAssignSubmit(e) {
    e.preventDefault();
    if (!targetAdmin || !selectedOrgId) return;

    setAssigning(true);
    setAssignError('');
    try {
      await orgApi.assignOrgAdmin(Number(selectedOrgId), targetAdmin.id);
      const assignedOrg = orgs.find((o) => o.id === Number(selectedOrgId));
      setAssignSuccess(
        `✓ "${targetAdmin.fullName || targetAdmin.email}" was successfully assigned to "${assignedOrg?.name || 'Organization'}" and moved to Organization Administrators!`
      );
      setShowAssignModal(false);
      setTargetAdmin(null);
      setSelectedOrgId('');
      // Reload data to reflect movement immediately
      loadData();
    } catch (err) {
      setAssignError(extractErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  }

  async function handleToggleUserStatus(u, currentEnabled) {
    setUserActionError('');
    setUpdatingUserId(u.id);
    const nextEnabled = !currentEnabled;
    try {
      await adminApi.toggleUserStatus(u.id, nextEnabled);
      setAllUsers((prev) =>
        prev.map((item) =>
          item.id === u.id ? { ...item, enabled: nextEnabled } : item
        )
      );
    } catch (err) {
      setUserActionError(extractErrorMessage(err));
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleDeleteUser(u) {
    if (
      !confirm(
        `Are you sure you want to delete newly registered Org Admin "${u.fullName || u.email}"?`
      )
    )
      return;
    setUserActionError('');
    try {
      await adminApi.deleteUser(u.id);
      setAllUsers((prev) => prev.filter((item) => item.id !== u.id));
    } catch (err) {
      setUserActionError(extractErrorMessage(err));
    }
  }

  async function handleViewUser(id) {
    setUserActionError('');
    try {
      const res = await adminApi.getUserById(id);
      setSelectedUser(res.data);
    } catch (err) {
      setUserActionError(extractErrorMessage(err));
    }
  }

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Platform Administration
          </p>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            New Org Admins
            {unassignedOrgAdmins.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                {unassignedOrgAdmins.length} Awaiting Assignment
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-700 mt-1">
            Newly registered Organization Administrators waiting for organization assignment. Assigning an organization moves them to Organization Administrators.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/org-admins"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <span>View Assigned Admins</span>
            <IconArrowRight size={14} />
          </Link>
        </div>
      </div>

      {assignSuccess && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <IconCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="font-medium">{assignSuccess}</span>
          </div>
          <Link
            to="/admin/org-admins"
            className="text-xs font-bold text-green-800 hover:underline flex items-center gap-1 ml-4"
          >
            Open Organization Administrators →
          </Link>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm">
          {error}
        </div>
      )}

      {userActionError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm">
          {userActionError}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
            <span>Awaiting Assignment</span>
            <IconUsers className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
          <p className="text-xs text-slate-500 mt-2">New Org Admins without organization</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
            <span>Active Accounts</span>
            <IconCheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.active}</div>
          <p className="text-xs text-slate-500 mt-2">Verified & enabled admins</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
            <span>Available Organizations</span>
            <IconProjects className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.orgsCount}</div>
          <p className="text-xs text-slate-500 mt-2">Ready to receive administrators</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <IconUsers className="w-5 h-5 text-orange-500" />
              Newly Registered Org Admins
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These administrators registered with the Org Admin role and require an organization assignment.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search unassigned admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-48"
            />
            <span className="text-xs font-semibold px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full whitespace-nowrap">
              {filteredAdmins.length} Admin{filteredAdmins.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <IconUsers className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <IconCheckCircle className="w-10 h-10 text-green-500 mb-3" />
            <p className="text-sm font-semibold text-slate-800">
              {searchQuery ? 'No unassigned Org Admins match your search' : 'No new Org Admins pending assignment'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              All registered Organization Administrators currently have an assigned organization and are managed in{' '}
              <Link to="/admin/org-admins" className="text-orange-600 font-semibold hover:underline">
                Organization Administrators
              </Link>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs font-medium text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="pb-3 px-2">ID</th>
                  <th className="pb-3 px-2">Name</th>
                  <th className="pb-3 px-2">Email</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmins.map((u) => {
                  const isEnabled = u.enabled !== false && u.status !== 'INACTIVE';
                  const isUpdatingThisUser = updatingUserId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-mono text-xs text-slate-500">
                        #{u.id}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          type="button"
                          className="font-semibold text-slate-900 hover:text-orange-600 hover:underline text-left cursor-pointer"
                          onClick={() => handleViewUser(u.id)}
                        >
                          {u.fullName || u.name || 'User'}
                        </button>
                      </td>
                      <td className="py-3 px-2 text-slate-600">{u.email}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold rounded-md">
                          Org Admin
                        </span>
                      </td>
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
                      <td className="py-3 px-2 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1 text-xs font-semibold rounded-md bg-orange-600 hover:bg-orange-700 text-white transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                            onClick={() => handleOpenAssignModal(u)}
                          >
                            <span>🏢 Assign Organization</span>
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            onClick={() => handleViewUser(u.id)}
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                            disabled={isUpdatingThisUser}
                            onClick={() => handleToggleUserStatus(u, isEnabled)}
                          >
                            {isUpdatingThisUser
                              ? 'Updating...'
                              : isEnabled
                              ? 'Disable'
                              : 'Enable'}
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                            onClick={() => handleDeleteUser(u)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Organization Modal */}
      {showAssignModal && targetAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Assign Organization
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Assign an organization to{' '}
              <strong className="text-slate-900">
                {targetAdmin.fullName || targetAdmin.email}
              </strong>
              . Once assigned, this administrator will move to{' '}
              <span className="font-semibold text-orange-600">
                Organization Administrators
              </span>.
            </p>

            {assignError && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Organization *
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Choose an organization...
                  </option>
                  {orgs.map((o) => {
                    const currentAdmin = allUsers.find(
                      (u) =>
                        (u.role === 'ORG_ADMIN' || u.role === ROLES.ORG_ADMIN) &&
                        (u.organizationId === o.id || u.organizationName === o.name)
                    );
                    return (
                      <option key={o.id} value={o.id}>
                        {o.name}{' '}
                        {currentAdmin
                          ? `(Current Admin: ${currentAdmin.fullName || currentAdmin.email})`
                          : '(No Admin Assigned)'}
                      </option>
                    );
                  })}
                </select>
                {selectedOrgId && (() => {
                  const chosenOrg = orgs.find((o) => o.id === Number(selectedOrgId));
                  const currentAdmin = allUsers.find(
                    (u) =>
                      (u.role === 'ORG_ADMIN' || u.role === ROLES.ORG_ADMIN) &&
                      (u.organizationId === Number(selectedOrgId) || u.organizationName === chosenOrg?.name)
                  );
                  if (currentAdmin) {
                    return (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mt-2 font-medium">
                        ⚠️ "{chosenOrg?.name}" currently has an assigned admin ({currentAdmin.fullName || currentAdmin.email}). Assigning will demote the previous admin to Developer.
                      </p>
                    );
                  }
                  return (
                    <p className="text-xs text-slate-500 mt-2">
                      Assigning will link {targetAdmin.fullName || targetAdmin.email} as the designated administrator for {chosenOrg?.name}.
                    </p>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setShowAssignModal(false);
                    setTargetAdmin(null);
                    setSelectedOrgId('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-70 cursor-pointer"
                  disabled={assigning || !selectedOrgId}
                >
                  {assigning ? 'Assigning...' : 'Confirm & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              User Details
            </h3>
            <div className="space-y-3 text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p>
                <strong className="text-slate-900">ID:</strong>{' '}
                <span className="font-mono text-xs">{selectedUser.id}</span>
              </p>
              <p>
                <strong className="text-slate-900">Full Name:</strong>{' '}
                {selectedUser.fullName || selectedUser.name || '—'}
              </p>
              <p>
                <strong className="text-slate-900">Email:</strong>{' '}
                {selectedUser.email}
              </p>
              <p>
                <strong className="text-slate-900">Phone:</strong>{' '}
                {selectedUser.phoneNumber || selectedUser.phone || '—'}
              </p>
              <p>
                <strong className="text-slate-900">Role:</strong>{' '}
                {formatEnum(selectedUser.role)}
              </p>
              <p>
                <strong className="text-slate-900">Status:</strong>{' '}
                {selectedUser.enabled !== false ? 'Active' : 'Inactive'}
              </p>
              <p>
                <strong className="text-slate-900">Organization:</strong>{' '}
                <span className="text-amber-600 font-medium">Unassigned (Awaiting Assignment)</span>
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
