import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  IconProjects,
  IconCheckCircle,
  IconAlertTriangle,
  IconClock,
  IconArrowRight,
  IconUsers,
} from "../components/icons.jsx";
import { useAuth, ROLES } from "../context/AuthContext.jsx";
import { projectApi } from "../api/projectApi.js";
import { orgApi } from "../api/orgApi.js";
import { adminApi } from "../api/adminApi.js";
import { taskApi } from "../api/taskApi.js";
import { extractErrorMessage } from "../api/client.js";
import Can from "../components/Can.jsx";
import HealthBadge from "../components/HealthBadge.jsx";
import UnassignedOrgNotice from "../components/UnassignedOrgNotice.jsx";
import RecentActivities from "../components/RecentActivities.jsx";
import PortalDropdown from "../components/PortalDropdown.jsx";
import { Activity } from "lucide-react";
const OrgAdminCell = ({
  org,
  orgAdminUser,
  openOrgDropdownId,
  setOpenOrgDropdownId,
  onStartAssignAdmin,
  handleRemoveOrgAdmin,
}) => {
  const triggerRef = useRef(null);
  const isOpen = openOrgDropdownId === org.id;

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 flex items-center gap-1 hover:bg-green-200 transition-colors cursor-pointer"
        onClick={() =>
          setOpenOrgDropdownId((prev) => (prev === org.id ? null : org.id))
        }
      >
        <span>✅ Assigned</span>
        <span
          className={`text-[10px] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      <PortalDropdown
        isOpen={isOpen}
        onClose={() => setOpenOrgDropdownId(null)}
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
          className="w-full text-left px-3 py-2 text-xs font-medium text-blue-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
          onClick={() => {
            setOpenOrgDropdownId(null);
            onStartAssignAdmin(org, orgAdminUser);
          }}
        >
          ✏️ Change Org Admin
        </button>
        <button
          type="button"
          className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
          onClick={() => {
            setOpenOrgDropdownId(null);
            handleRemoveOrgAdmin(org.id, orgAdminUser.id);
          }}
        >
          🗑️ Remove Org Admin
        </button>
      </PortalDropdown>
    </div>
  );
};

const formatEnum = (val) =>
  val
    ? val.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "Unknown";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHome() {
  const { user, role } = useAuth();
  const isSuperAdmin =
    role === ROLES.SUPER_ADMIN || user?.role === ROLES.SUPER_ADMIN;

  // Standard org user state
  const [projects, setProjects] = useState([]);
  const [teamsCount, setTeamsCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);
  const [joinRequests, setJoinRequests] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

  // Super Admin live state
  const [orgs, setOrgs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDescription, setNewOrgDescription] = useState("");
  const [createOrgError, setCreateOrgError] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // My Tasks for Developer / QA Tester
  const [myTasks, setMyTasks] = useState([]);
  const [myTasksLoading, setMyTasksLoading] = useState(false);

  // Selected project for activity feed
  const [selectedActivityProjectId, setSelectedActivityProjectId] = useState(() => {
    const cached = localStorage.getItem("neuroforge_current_project_id");
    return cached && !isNaN(Number(cached)) ? Number(cached) : null;
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (isSuperAdmin) {
        const [orgsRes, usersRes] = await Promise.all([
          orgApi.listOrganizations(),
          adminApi.getAllUsers(),
        ]);
        const loadedOrgs = Array.isArray(orgsRes.data) ? orgsRes.data : [];
        const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
        const sortedUsers = [...rawUsers].sort(
          (a, b) => Number(a.id) - Number(b.id),
        );
        setOrgs(loadedOrgs);
        setAllUsers(sortedUsers);

        if (loadedOrgs.length > 0) {
          const projectPromises = loadedOrgs.map((o) =>
            projectApi.listProjects(o.id).catch(() => ({ data: [] })),
          );
          const projectResults = await Promise.all(projectPromises);
          const allProjects = projectResults.flatMap((r) =>
            Array.isArray(r.data) ? r.data : [],
          );
          setProjects(allProjects);
        } else {
          setProjects([]);
        }
      } else {
        const promises = [
          projectApi.listProjects(user?.orgId).catch(() => ({ data: [] })),
          orgApi.listTeams(user?.orgId).catch(() => ({ data: [] })),
          orgApi.listMembers(user?.orgId).catch(() => ({ data: [] })),
        ];
        if (role === ROLES.ORG_ADMIN) {
          promises.push(
            orgApi.getJoinRequests(user?.orgId).catch(() => ({ data: [] })),
            orgApi.getPendingUsers(user?.orgId).catch(() => ({ data: [] }))
          );
        }

        const results = await Promise.all(promises);
        setProjects(Array.isArray(results[0].data) ? results[0].data : []);
        setTeamsCount(
          Array.isArray(results[1].data) ? results[1].data.length : 0,
        );
        setMembersCount(
          Array.isArray(results[2].data) ? results[2].data.length : 0,
        );
        if (role === ROLES.ORG_ADMIN && results[3]) {
          setJoinRequests(
            Array.isArray(results[3].data) ? results[3].data : [],
          );
          setPendingUsers(
            Array.isArray(results[4].data) ? results[4].data : [],
          );
        }
      }
    } catch (err) {
      setError(extractErrorMessage(err));
      setOrgs([]);
      setAllUsers([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, user?.orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const isDev = [ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER].includes(role);
    if (!isDev && role !== ROLES.QA_TESTER) return;
    setMyTasksLoading(true);
    taskApi.getMyTasks()
      .then((res) => setMyTasks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMyTasks([]))
      .finally(() => setMyTasksLoading(false));
  }, [role]);

  const stats = useMemo(() => {
    return {
      totalProjects: projects.length,
      totalTeams: teamsCount,
      totalMembers: membersCount,
    };
  }, [projects, teamsCount, membersCount]);

  // OrgAdmin Action Methods
  const [copiedOrgId, setCopiedOrgId] = useState(false);
  const handleCopyOrgId = (id) => {
    const val = id || user?.orgSpecificId || (user?.orgId ? `ORG-${user.orgId}` : "");
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
      setCopiedOrgId(true);
      setTimeout(() => setCopiedOrgId(false), 2000);
    });
  };

  const [actionError, setActionError] = useState("");
  async function handleApproveJoinRequest(userId) {
    setActionError("");
    try {
      await orgApi.approveJoinRequest(user?.orgId, userId);
      loadData();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  }

  async function handleRejectJoinRequest(userId) {
    if (!confirm("Are you sure you want to reject this join request?")) return;
    setActionError("");
    try {
      await orgApi.rejectJoinRequest(user?.orgId, userId);
      loadData();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  }

  async function handleApproveUser(userId) {
    setActionError("");
    try {
      await orgApi.approveUser(user?.orgId, userId);
      loadData();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  }

  async function handleRejectUser(userId) {
    if (!confirm("Are you sure you want to reject/disable this user?")) return;
    setActionError("");
    try {
      await orgApi.removeMember(user?.orgId, userId);
      loadData();
    } catch (err) {
      setActionError(extractErrorMessage(err));
    }
  }

  // State for Admin User Management
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "ORG_ADMIN",
    organizationId: "",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActionError, setUserActionError] = useState("");

  async function handleCreateUser(e) {
    e.preventDefault();
    if (!userForm.organizationId) {
      setCreateUserError("Organization selection is required.");
      return;
    }
    setCreatingUser(true);
    setCreateUserError("");
    try {
      await adminApi.createUser({
        ...userForm,
        organizationId: Number(userForm.organizationId)
      });
      setUserForm({
        fullName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "ORG_ADMIN",
        organizationId: "",
      });
      setShowCreateUserModal(false);
      loadData();
    } catch (err) {
      setCreateUserError(extractErrorMessage(err));
    } finally {
      setCreatingUser(false);
    }
  }


  const [supportEmail, setSupportEmail] = useState("");
  const [deletingOrgId, setDeletingOrgId] = useState(null);

  async function handleDeleteOrg(org) {
    if (
      !confirm(
        `Are you sure you want to permanently delete the organization "${org.name}"? This action cannot be undone.`,
      )
    )
      return;
    setError("");
    setDeletingOrgId(org.id);
    try {
      await orgApi.deleteOrganization(org.id);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingOrgId(null);
    }
  }

  async function handleCreateOrg(e) {
    e.preventDefault();
    if (!newOrgName.trim() || !supportEmail.trim()) return;
    setCreatingOrg(true);
    setCreateOrgError("");
    try {
      await orgApi.createOrganization({
        name: newOrgName.trim(),
        description: newOrgDescription.trim(),
        supportEmail: supportEmail.trim(),
      });
      setNewOrgName("");
      setNewOrgDescription("");
      setSupportEmail("");
      setShowCreateOrgModal(false);
      loadData();
    } catch (err) {
      setCreateOrgError(extractErrorMessage(err));
    } finally {
      setCreatingOrg(false);
    }
  }

  // Org Admin Assign State
  const [openOrgDropdownId, setOpenOrgDropdownId] = useState(null);
  const [showAssignAdminModal, setShowAssignAdminModal] = useState(false);
  const [selectedOrgForAdmin, setSelectedOrgForAdmin] = useState(null);
  const [currentAdminUserForOrg, setCurrentAdminUserForOrg] = useState(null);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState("");
  const [assignAdminError, setAssignAdminError] = useState("");
  const [assigningAdmin, setAssigningAdmin] = useState(false);

  function handleStartAssignAdmin(org, currentAdmin = null) {
    setOpenOrgDropdownId(null);
    setSelectedOrgForAdmin(org);
    setCurrentAdminUserForOrg(currentAdmin);
    setSelectedAdminUserId("");
    setAssignAdminError("");
    setShowAssignAdminModal(true);
  }

  async function handleAssignAdminSubmit(e) {
    e.preventDefault();
    if (!selectedAdminUserId || !selectedOrgForAdmin) return;
    setAssigningAdmin(true);
    setAssignAdminError("");
    try {
      await orgApi.assignOrgAdmin(
        selectedOrgForAdmin.id,
        Number(selectedAdminUserId),
      );
      setShowAssignAdminModal(false);
      setSelectedOrgForAdmin(null);
      setCurrentAdminUserForOrg(null);
      setSelectedAdminUserId("");
      loadData();
    } catch (err) {
      setAssignAdminError(extractErrorMessage(err));
    } finally {
      setAssigningAdmin(false);
    }
  }

  async function handleRemoveOrgAdmin(orgId, userId) {
    if (
      !confirm(
        "Are you sure you want to remove this user as Org Admin? Their role will revert to Developer.",
      )
    )
      return;
    setError("");
    try {
      await orgApi.removeOrgAdmin(orgId, userId);
      loadData();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }



  const orgAdminUsers = useMemo(() => {
    return allUsers.filter(
      (u) => u.role === "ORG_ADMIN" || u.role === ROLES.ORG_ADMIN
    );
  }, [allUsers]);

  const userStats = useMemo(() => {
    const active = orgAdminUsers.filter(
      (u) => u.enabled !== false && u.status !== "INACTIVE",
    ).length;
    const inactive = orgAdminUsers.length - active;
    return { total: orgAdminUsers.length, active, inactive };
  }, [orgAdminUsers]);

  if (!isSuperAdmin && !user?.orgId) {
    return <UnassignedOrgNotice />;
  }

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Hero */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            {greeting()}
          </p>
          <h2 className="text-2xl font-bold text-slate-900">
            {user?.fullName?.split(" ")[0]},{" "}
            {isSuperAdmin ? "platform administration." : "welcome back."}
          </h2>
          <p className="text-sm text-slate-700 mt-1">
            {isSuperAdmin
              ? `Super Admin Overview · ${orgs.length} Organization(s) · ${orgAdminUsers.length} Org Admin(s)`
              : `${user?.orgName || "NeuroForge"} · ${stats.totalProjects} active project(s)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isSuperAdmin && role === ROLES.ORG_ADMIN && (
            <Link
              to="/activities"
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 hover:border-orange-300 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 transition-all flex items-center gap-1.5 shadow-xs"
              title="View full audit log & activities"
            >
              <Activity size={14} className="text-orange-600" />
              <span>Recent Activities</span>
            </Link>
          )}
          {isSuperAdmin ? (
            <button
              onClick={() => setShowCreateOrgModal(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              + Create Organization
            </button>
          ) : (
            <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN]}>
              <Link
                to="/projects/new"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                New project <IconArrowRight size={14} />
              </Link>
            </Can>
          )}
        </div>
      </div>

      {!isSuperAdmin && error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSuperAdmin ? (
          <>
            <div
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-orange-200 transition-all"
              onClick={() => document.getElementById("organizations-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
                <span>Total Organizations</span>
                <IconProjects className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {orgs.length}
              </div>
            </div>
            <Link
              to="/admin/org-admins"
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-orange-200 transition-all"
            >
              <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
                <span>Total Org Admins</span>
                <IconUsers className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {userStats.total}
              </div>
            </Link>
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
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
                <span>Total Projects</span>
                <IconProjects className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {stats.totalProjects}
              </div>
            </div>
            {role === ROLES.ORG_ADMIN ? (
              <Link
                to="/org/members"
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-orange-200 transition-all group"
              >
                <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
                  <span className="group-hover:text-orange-600 transition-colors">Total Members</span>
                  <IconUsers className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <div className="text-3xl font-bold text-slate-900 flex items-baseline justify-between">
                  <span>{stats.totalMembers}</span>
                  <span className="text-xs font-semibold text-orange-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    View Members →
                  </span>
                </div>
              </Link>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
                <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
                  <span>Total Members</span>
                  <IconUsers className="w-5 h-5 text-slate-400" />
                </div>
                <div className="text-3xl font-bold text-slate-900">
                  {stats.totalMembers}
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
              <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
                <span>Total Teams</span>
                <IconUsers className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {stats.totalTeams}
              </div>
            </div>
            {role === ROLES.ORG_ADMIN && (
              <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 flex flex-col justify-between bg-gradient-to-br from-white to-orange-50/50">
                <div className="text-sm font-medium text-slate-600 mb-2 flex items-center justify-between">
                  <span>Org Specific ID</span>
                  <span className="text-[11px] font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                    Share to Join
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-2xl font-mono font-bold text-orange-600">
                    {user?.orgSpecificId || (user?.orgId ? `ORG-${user.orgId}` : "—")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/org/settings"
                      className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-xs"
                      title="Edit Organization Specific ID"
                    >
                      Edit ID
                    </Link>
                    {user?.orgId && (
                      <button
                        type="button"
                        onClick={() => handleCopyOrgId()}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md border border-orange-300 bg-white hover:bg-orange-50 text-orange-700 transition-colors shadow-xs cursor-pointer"
                        title="Copy Organization Specific ID"
                      >
                        {copiedOrgId ? "✓ Copied" : "Copy ID"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Super Admin Sections */}
      {isSuperAdmin ? (
        <>
          {/* Organizations Section */}
          <div id="organizations-section" style={{ scrollMarginTop: '100px' }} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800">
                Organizations
              </h3>
              <span className="text-xs font-medium text-slate-500">
                {orgs.length} total
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <IconProjects className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">Loading...</p>
              </div>
            ) : orgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <IconProjects className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  No organizations found
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Click "+ Create Organization" above to add one.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="text-xs font-medium text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="pb-3 px-2">ID</th>
                      <th className="pb-3 px-2">Organization Name</th>
                      <th className="pb-3 px-2">Description</th>
                      <th className="pb-3 px-2">Org Admin (Max 1)</th>
                      <th className="pb-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orgs.map((org) => {
                      const orgAdminUser =
                        allUsers.find(
                          (u) =>
                            u.organizationId === org.id &&
                            (u.role === "ORG_ADMIN" ||
                              u.role === ROLES.ORG_ADMIN),
                        ) ||
                        allUsers.find(
                          (u) =>
                            (u.role === "ORG_ADMIN" ||
                              u.role === ROLES.ORG_ADMIN) &&
                            u.organizationName === org.name,
                        );

                      return (
                        <tr key={org.id} className="hover:bg-slate-50">
                          <td className="py-3 px-2 font-mono text-xs text-slate-500">
                            {org.id}
                          </td>
                          <td className="py-3 px-2 font-medium text-slate-900">
                            {org.name}
                          </td>
                          <td className="py-3 px-2 text-slate-600">
                            {org.description || "—"}
                          </td>
                          <td className="py-3 px-2">
                            {orgAdminUser ? (
                              <OrgAdminCell
                                org={org}
                                orgAdminUser={orgAdminUser}
                                openOrgDropdownId={openOrgDropdownId}
                                setOpenOrgDropdownId={setOpenOrgDropdownId}
                                onStartAssignAdmin={handleStartAssignAdmin}
                                handleRemoveOrgAdmin={handleRemoveOrgAdmin}
                              />
                            ) : (
                              <button
                                type="button"
                                className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                                onClick={() => handleStartAssignAdmin(org, null)}
                              >
                                + Assign Admin
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              type="button"
                              className="px-3 py-1 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              onClick={() => handleDeleteOrg(org)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : role === ROLES.ORG_ADMIN ? (
        <div className="space-y-6">
            {/* Live Projects List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Live Projects</h3>
                <Link
                  to="/projects"
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                >
                  View all <IconArrowRight size={13} />
                </Link>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  <IconProjects className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">Loading...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  <IconProjects className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">
                    No projects found
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Get started by creating a new project.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.slice(0, 5).map((p) => {
                    const pct = p.progressPercent ?? 0;
                    return (
                      <div key={p.id} className="block bg-slate-50 rounded-lg border border-slate-100 p-5 hover:border-orange-200 transition-colors group relative">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 cursor-pointer" onClick={() => window.location.href = `/projects/${p.id}`}>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-base font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                                {p.name}
                              </span>
                              <HealthBadge status={p.health} />
                            </div>
                            <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-sm mt-1">
                              {formatEnum(p.methodology)}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <Link
                              to={`/projects/${p.id}/specs`}
                              className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm hover:border-orange-300 hover:bg-orange-50 text-slate-700 hover:text-orange-700 text-xs font-semibold rounded-md transition-all z-10"
                            >
                              Generate / View Specs
                            </Link>

                            <div className="flex items-center gap-3 w-32 cursor-pointer" onClick={() => window.location.href = `/projects/${p.id}`}>
                              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-slate-700 w-10 text-right">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Organization Registration Key Info Banner for ORG_ADMIN */}
            {user?.orgId && (
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 border border-orange-200 rounded-xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                      #
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                          Organization Specific ID
                        </h4>
                        <span className="text-xs bg-orange-200/80 text-orange-800 font-semibold px-2 py-0.5 rounded-full">
                          For Team Member Registration
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-mono font-extrabold text-orange-700 tracking-wider">
                          {user?.orgSpecificId || (user?.orgId ? `ORG-${user.orgId}` : '—')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                        Share this ID with new team members. When they register on the sign-up page, they enter this ID in the registration text box to join <strong>{user?.orgName || 'your organization'}</strong>. You will receive their join request below for approval.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <Link
                      to="/org/settings"
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                    >
                      Edit ID
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleCopyOrgId()}
                      className="px-4 py-2 bg-white hover:bg-orange-50 text-orange-700 text-xs font-bold border border-orange-300 rounded-lg shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {copiedOrgId ? (
                        <>
                          <IconCheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy Org ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Join Requests for ORG_ADMIN */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">
                  Pending Join Requests
                </h3>
                <span className="text-xs font-medium text-slate-500">
                  {joinRequests.length} total
                </span>
              </div>

              {actionError && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
                  {actionError}
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  <IconUsers className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">
                    Loading...
                  </p>
                </div>
              ) : joinRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  <IconUsers className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600">
                    No pending join requests
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    You're all caught up.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="text-xs font-medium text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="pb-3 px-2">Name</th>
                        <th className="pb-3 px-2">Email</th>
                        <th className="pb-3 px-2">Role</th>
                        <th className="pb-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {joinRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50">
                          <td className="py-3 px-2 font-medium text-slate-900">
                            {req.fullName || "User"}
                          </td>
                          <td className="py-3 px-2 text-slate-600">
                            {req.email}
                          </td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md">
                              {formatEnum(req.role)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors"
                                onClick={() => handleApproveJoinRequest(req.id)}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                                onClick={() => handleRejectJoinRequest(req.id)}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Activities for Org Admin */}
            <RecentActivities />
        </div>
      ) : (
        <>
          {/* Projects List for Standard Users */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-800">
                {role === ROLES.CLIENT ? "Project progress" : "Live Projects"}
              </h3>
              <Link
                to="/projects"
                className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                View all <IconArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <IconProjects className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">Loading...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <IconProjects className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">
                  No projects found
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Get started by creating a new project.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((p) => {
                  const pct = p.progressPercent ?? 0;
                  return (
                    <div key={p.id} className="block bg-slate-50 rounded-lg border border-slate-100 p-5 hover:border-orange-200 transition-colors group relative">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 cursor-pointer" onClick={() => window.location.href = `/projects/${p.id}`}>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-base font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                              {p.name}
                            </span>
                            <HealthBadge status={p.health} />
                          </div>
                          <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-sm mt-1">
                            {formatEnum(p.methodology)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <Link
                            to={`/projects/${p.id}/specs`}
                            className="px-3 py-1.5 bg-white border border-slate-200 shadow-sm hover:border-orange-300 hover:bg-orange-50 text-slate-700 hover:text-orange-700 text-xs font-semibold rounded-md transition-all z-10"
                          >
                            Generate / View Specs
                          </Link>

                          <div className="flex items-center gap-3 w-32 cursor-pointer" onClick={() => window.location.href = `/projects/${p.id}`}>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-slate-700 w-10 text-right">
                              {pct}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activities for Project Manager */}
          {role === ROLES.PROJECT_MANAGER && (
            <div className="space-y-3">
              {projects.length > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Project Scope:</span>
                    <select
                      value={selectedActivityProjectId || ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setSelectedActivityProjectId(val);
                        if (val) localStorage.setItem("neuroforge_current_project_id", val);
                      }}
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium text-slate-800 cursor-pointer"
                    >
                      <option value="">All My Projects</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Link
                    to="/activities"
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 self-start sm:self-auto"
                  >
                    Full Activity Log <IconArrowRight size={13} />
                  </Link>
                </div>
              )}
              <RecentActivities projectId={selectedActivityProjectId || (projects.length === 1 ? projects[0].id : null)} />
            </div>
          )}

          {/* My Tasks - Developer & QA Tester only */}
          {([ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER].includes(role) || role === ROLES.QA_TESTER) && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  My Tasks
                </h3>
                <span className="text-xs font-medium text-slate-500">{myTasks.length} task(s)</span>
              </div>
              {myTasksLoading ? (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  <svg className="w-8 h-8 text-slate-300 mb-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  <p className="text-sm font-medium text-slate-600">Loading your tasks…</p>
                </div>
              ) : myTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                  <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <p className="text-sm font-medium text-slate-600">No tasks assigned to you yet</p>
                  <p className="text-xs text-slate-400 mt-1">Your Project Manager will assign tasks when they plan a sprint.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myTasks.map((task) => {
                    const statusColors = {
                      TODO: 'bg-slate-100 text-slate-700',
                      IN_PROGRESS: 'bg-blue-100 text-blue-700',
                      CODE_REVIEW: 'bg-purple-100 text-purple-700',
                      TESTING: 'bg-yellow-100 text-yellow-700',
                      DONE: 'bg-green-100 text-green-700',
                    };
                    const priorityColors = {
                      HIGH: 'bg-red-100 text-red-700',
                      CRITICAL: 'bg-red-200 text-red-900',
                      MEDIUM: 'bg-orange-100 text-orange-700',
                      LOW: 'bg-slate-100 text-slate-600',
                    };
                    const sColor = statusColors[task.status] || 'bg-slate-100 text-slate-700';
                    const pColor = priorityColors[task.priority] || 'bg-slate-100 text-slate-600';
                    const fmtEnum = (v) => v ? v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—';
                    return (
                      <div key={task.id} className="flex items-start gap-4 py-4 hover:bg-slate-50 transition-colors rounded-lg px-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
                          {task.storyPoints ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{task.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">{task.projectName}</span>
                            {task.sprintName && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                {task.sprintName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pColor}`}>{fmtEnum(task.priority)}</span>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${sColor}`}>{fmtEnum(task.status)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {/* Create Org Modal */}
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

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Create Platform User
            </h3>
            {createUserError && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
                {createUserError}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={userForm.fullName}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={userForm.phoneNumber}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, phoneNumber: e.target.value }))
                  }
                  placeholder="9876543210"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, password: e.target.value }))
                  }
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Organization *
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  value={userForm.organizationId}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, organizationId: e.target.value }))
                  }
                  required
                >
                  <option value="">-- Choose Organization --</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Role *
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm((f) => ({ ...f, role: e.target.value }))
                  }
                >
                  <option value="ORG_ADMIN">Org Admin</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="QA_TESTER">QA Tester</option>
                  <option value="CLIENT">Client</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  onClick={() => setShowCreateUserModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-70"
                  disabled={creatingUser}
                >
                  {creatingUser ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign / Change Org Admin Modal */}
      {showAssignAdminModal && selectedOrgForAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {currentAdminUserForOrg ? "Change Organization Admin" : "Assign Organization Admin"}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {currentAdminUserForOrg ? (
                <>
                  Select a new admin for{" "}
                  <strong className="text-slate-900">{selectedOrgForAdmin.name}</strong>.
                  The previous admin (
                  <span className="font-semibold text-slate-800">
                    {currentAdminUserForOrg.fullName ||
                      currentAdminUserForOrg.name ||
                      currentAdminUserForOrg.email}
                  </span>
                  ) will be demoted to Developer.
                </>
              ) : (
                <>
                  Select an admin for{" "}
                  <strong className="text-slate-900">
                    {selectedOrgForAdmin.name}
                  </strong>.
                </>
              )}
            </p>
            {assignAdminError && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
                {assignAdminError}
              </div>
            )}
            <form onSubmit={handleAssignAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Org Admin *
                </label>
                {(() => {
                  const candidateOrgAdmins = allUsers.filter((u) => {
                    const role = (u.role || "").toUpperCase();
                    const isOrgAdmin = role === "ORG_ADMIN" || u.role === ROLES.ORG_ADMIN;
                    if (!isOrgAdmin) return false;
                    // Only suggest unassigned Org Admins
                    const isAssigned = Boolean(u.organizationId || u.organizationName || u.orgId);
                    if (isAssigned) return false;
                    if (
                      currentAdminUserForOrg &&
                      Number(u.id) === Number(currentAdminUserForOrg.id)
                    ) {
                      return false;
                    }
                    return true;
                  });

                  return (
                    <>
                      <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        value={selectedAdminUserId}
                        onChange={(e) => setSelectedAdminUserId(e.target.value)}
                        required
                        disabled={candidateOrgAdmins.length === 0}
                      >
                        <option value="" disabled>
                          {candidateOrgAdmins.length === 0
                            ? "No unassigned Org Admins available"
                            : "Select an unassigned Org Admin..."}
                        </option>
                        {candidateOrgAdmins.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName || u.name} ({u.email}) — Unassigned Org Admin
                          </option>
                        ))}
                      </select>
                      {candidateOrgAdmins.length === 0 ? (
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                          ⚠️ No unassigned accounts with the Org Admin role are available. Only unassigned Org Admins can be selected.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-2">
                          Only unassigned users with the Org Admin role are suggested. Assigning will grant them full admin control for {selectedOrgForAdmin.name}.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setShowAssignAdminModal(false);
                    setSelectedOrgForAdmin(null);
                    setCurrentAdminUserForOrg(null);
                    setSelectedAdminUserId("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-70 cursor-pointer"
                  disabled={assigningAdmin || !selectedAdminUserId}
                >
                  {assigningAdmin
                    ? "Saving..."
                    : currentAdminUserForOrg
                    ? "Change Admin"
                    : "Assign Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
