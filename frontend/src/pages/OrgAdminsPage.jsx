import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  IconUsers,
  IconCheckCircle,
  IconClock,
  IconArrowRight,
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

export default function OrgAdminsPage() {
  const { user, role } = useAuth();
  const isSuperAdmin = role === ROLES.SUPER_ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const [allUsers, setAllUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActionError, setUserActionError] = useState('');

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

  // Filter strictly to assigned Organization Administrators (who have an organization assigned)
  const orgAdminUsers = useMemo(() => {
    return allUsers.filter(
      (u) =>
        (u.role === 'ORG_ADMIN' || u.role === ROLES.ORG_ADMIN) &&
        Boolean(u.organizationId || u.organizationName || u.orgId)
    );
  }, [allUsers]);

  // Track unassigned count for banner notice
  const unassignedCount = useMemo(() => {
    return allUsers.filter(
      (u) =>
        (u.role === 'ORG_ADMIN' || u.role === ROLES.ORG_ADMIN) &&
        !u.organizationId &&
        !u.organizationName &&
        !u.orgId
    ).length;
  }, [allUsers]);

  const filteredOrgAdmins = useMemo(() => {
    if (!adminSearchQuery.trim()) return orgAdminUsers;
    const q = adminSearchQuery.toLowerCase();
    return orgAdminUsers.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.organizationName?.toLowerCase().includes(q)
    );
  }, [orgAdminUsers, adminSearchQuery]);

  const userStats = useMemo(() => {
    const active = orgAdminUsers.filter(
      (u) => u.enabled !== false && u.status !== 'INACTIVE'
    ).length;
    const inactive = orgAdminUsers.length - active;
    return { total: orgAdminUsers.length, active, inactive };
  }, [orgAdminUsers]);

  async function handleToggleUserStatus(u, currentStatus) {
    setUserActionError('');
    setUpdatingUserId(u.id);
    try {
      await adminApi.toggleUserStatus(u.id, !currentStatus);
      setAllUsers((prevUsers) =>
        prevUsers.map((item) =>
          item.id === u.id ? { ...item, enabled: !currentStatus } : item
        )
      );
    } catch (err) {
      setUserActionError(extractErrorMessage(err));
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleDeleteUser(u) {
    if (u.role === ROLES.SUPER_ADMIN || u.role === 'SUPER_ADMIN') {
      setUserActionError('SUPER_ADMIN account cannot be deleted.');
      return;
    }
    if (
      !confirm(
        `Are you sure you want to delete user "${u.fullName || u.email}"?`
      )
    )
      return;
    setUserActionError('');
    const previousUsers = allUsers;
    setAllUsers((prev) => prev.filter((item) => item.id !== u.id));
    try {
      await adminApi.deleteUser(u.id);
    } catch (err) {
      setAllUsers(previousUsers);
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
      {/* Hero Header */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Platform Administration
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            Organization Administrators
          </h2>
          <p className="text-sm text-slate-700 mt-1">
            Super Admin Overview · {orgs.length} Organization(s) · {orgAdminUsers.length} Org Admin(s)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/unassigned-admins"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <IconUsers size={14} className="text-orange-600" />
            <span>New Org Admins ({unassignedCount})</span>
          </Link>
          <Link
            to="/organizations"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            Manage Organizations <IconArrowRight size={14} />
          </Link>
        </div>
      </div>

      {unassignedCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-900 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <IconUsers className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-orange-950">
                {unassignedCount} new Org Admin{unassignedCount !== 1 ? 's' : ''} registered!
              </span>{' '}
              Assign them an organization to move them into this Organization Administrators list.
            </div>
          </div>
          <Link
            to="/admin/unassigned-admins"
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Assign in New Org Admins →
          </Link>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
            <span>Total Org Admins</span>
            <IconUsers className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {userStats.total}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
            <span>Active Org Admins</span>
            <IconCheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {userStats.active}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
            <span>Inactive Org Admins</span>
            <IconClock className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {userStats.inactive}
          </div>
        </div>
      </div>

      {/* Organization Administrators Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <IconUsers className="w-5 h-5 text-orange-500" />
              Organization Administrators
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing designated Organization Administrators managing registered organizations.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search Org Admins..."
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 w-full sm:w-48"
            />
            <span className="text-xs font-semibold px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full whitespace-nowrap">
              {filteredOrgAdmins.length} Org Admin{filteredOrgAdmins.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {userActionError && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
            {userActionError}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <IconUsers className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading...</p>
          </div>
        ) : filteredOrgAdmins.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <IconUsers className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">
              {adminSearchQuery
                ? 'No Organization Administrators match your search'
                : 'No assigned Organization Administrators yet'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Newly registered Org Admins appear in{' '}
              <Link to="/admin/unassigned-admins" className="text-orange-600 font-semibold hover:underline">
                New Org Admins
              </Link>{' '}
              until an organization is assigned to them.
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
                  <th className="pb-3 px-2">Organization</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrgAdmins.map((u) => {
                  const isEnabled = u.enabled !== false && u.status !== 'INACTIVE';
                  const isUpdatingThisUser = updatingUserId === u.id;
                  const orgName =
                    u.organizationName ||
                    orgs.find((o) => o.id === u.organizationId)?.name ||
                    '—';

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
                      <td className="py-3 px-2 font-medium text-slate-900">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          🏢 {orgName}
                        </span>
                      </td>
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
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="px-3 py-1 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              {selectedUser.organizationName && (
                <p>
                  <strong className="text-slate-900">Organization:</strong>{' '}
                  {selectedUser.organizationName}
                </p>
              )}
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
