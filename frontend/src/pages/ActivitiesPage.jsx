import { useState, useEffect } from "react";
import { useAuth, ROLES } from "../context/AuthContext.jsx";
import RecentActivities from "../components/RecentActivities.jsx";
import UnassignedOrgNotice from "../components/UnassignedOrgNotice.jsx";
import { projectApi } from "../api/projectApi.js";
import { Link } from "react-router-dom";
import { ArrowLeft, Activity, ShieldCheck, Folder } from "lucide-react";

export default function ActivitiesPage() {
  const { user, role } = useAuth();
  const isSuperAdmin = role === ROLES.SUPER_ADMIN || user?.role === ROLES.SUPER_ADMIN;
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    const cached = localStorage.getItem("neuroforge_current_project_id");
    return cached && !isNaN(Number(cached)) ? Number(cached) : null;
  });

  useEffect(() => {
    if (user?.orgId && role !== ROLES.SUPER_ADMIN) {
      projectApi
        .listProjects(user.orgId)
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          setProjects(list);
          // If cached project ID is not in list, keep null or pick first
          if (selectedProjectId && !list.some((p) => p.id === selectedProjectId)) {
            setSelectedProjectId(list.length > 0 ? list[0].id : null);
          }
        })
        .catch(() => {});
    }
  }, [user?.orgId, role]);

  const handleProjectFilterChange = (e) => {
    const val = e.target.value;
    const pId = val ? Number(val) : null;
    setSelectedProjectId(pId);
    if (pId) {
      localStorage.setItem("neuroforge_current_project_id", pId);
    }
  };

  if (!isSuperAdmin && !user?.orgId) {
    return <UnassignedOrgNotice />;
  }

  const activeProjectName = projects.find((p) => p.id === selectedProjectId)?.name;

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Link to="/dashboard" className="hover:text-orange-600 transition-colors flex items-center gap-1">
              <ArrowLeft size={13} /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-orange-600">Audit & Activities</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Activity className="text-orange-600 w-6 h-6" />
            Recent Activities & Audit Trail
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time telemetry of Project Manager updates, approvals, specifications, and project milestones for{" "}
            <strong>{user?.orgName || "your organization"}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Selector Filter */}
          {projects.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              <Folder size={14} className="text-orange-500" />
              <span className="text-xs font-medium text-slate-500">Project:</span>
              <select
                value={selectedProjectId || ""}
                onChange={handleProjectFilterChange}
                className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Audit Trail Active</span>
          </div>
        </div>
      </div>

      {/* Main Activities Feed */}
      <div className="w-full max-w-5xl">
        <RecentActivities projectId={selectedProjectId} className="shadow-md border-slate-200" />
      </div>
    </div>
  );
}
