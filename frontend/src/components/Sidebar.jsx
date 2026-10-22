import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Folder, Users, Settings, LogOut, Plus, ChevronDown, Sparkles, CheckSquare, Flag, BarChart3, Layers, Activity, UserPlus } from 'lucide-react'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { projectApi } from '../api/projectApi.js'
import { orgApi } from '../api/orgApi.js'
import { adminApi } from '../api/adminApi.js'
import Avatar from './Avatar.jsx'

function getNavSections(currentProjectId, role, hasProjects, unassignedCount = 0) {
  if (role === ROLES.SUPER_ADMIN) {
    return [
      {
        label: 'Platform Administration',
        items: [
          { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: null },
          {
            to: '/admin/unassigned-admins',
            label: 'New Org Admins',
            icon: UserPlus,
            badge: unassignedCount,
            roles: null,
          },
          { to: '/admin/org-admins', label: 'Organization Administrators', icon: Users, roles: null },
          { to: '/organizations', label: 'Organizations', icon: Folder, roles: null },
        ],
      },
    ]
  }

  const workspaceItems = [
    { to: '/dashboard', label: role === ROLES.CLIENT ? 'Client Dashboard' : 'Dashboard', icon: LayoutDashboard, roles: null },
    {
      to: '/activities',
      label: 'Recent Activities',
      icon: Activity,
      roles: [ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER],
      isActivities: true,
    },
    { to: '/projects', label: 'Projects', icon: Folder, roles: null },
  ]

  if (hasProjects) {
    workspaceItems.push(
      { to: `/projects/${currentProjectId}/approvals`, label: 'Request Approvals', icon: CheckSquare, roles: [ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER, ROLES.CLIENT] },
      { to: `/projects/${currentProjectId}/specs`, label: 'AI Spec Studio', icon: Sparkles, roles: [ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER, ROLES.QA_TESTER, ROLES.CLIENT] },
      { to: `/projects/${currentProjectId}/backlog`, label: 'Backlog & Board', icon: Layers, roles: [ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER, ROLES.QA_TESTER] },
      { to: `/projects/${currentProjectId}/bugs`, label: 'Bugs', icon: Folder, roles: [ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER, ROLES.QA_TESTER] },
      { to: `/projects/${currentProjectId}/milestones`, label: 'Milestones', icon: Flag, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER, ROLES.QA_TESTER, ROLES.CLIENT] },
      { to: `/projects/${currentProjectId}/reports`, label: 'Reports', icon: BarChart3, roles: null }
    )
  }

  return [
    {
      label: role === ROLES.CLIENT ? 'CLIENT PORTAL' : 'CORE',
      items: workspaceItems,
    },
    {
      label: 'ORGANIZATION',
      items: [
        { to: '/org/members', label: 'Organization Members', icon: Users, roles: [ROLES.ORG_ADMIN] },
        { to: '/org/teams', label: role === ROLES.ORG_ADMIN ? 'Teams' : 'Teams & Members', icon: Users, roles: [ROLES.ORG_ADMIN, ROLES.PROJECT_MANAGER] },
        { to: '/org/invites', label: 'Pending Invites', icon: UserPlus, roles: [ROLES.ORG_ADMIN] },
        { to: '/org/settings', label: 'Organization Settings', icon: Settings, roles: [ROLES.ORG_ADMIN] },
      ],
    },
  ]
}


export default function Sidebar({ width = 256, onMouseDown, isResizing }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, role, logout } = useAuth()
  const [projects, setProjects] = useState([])

  const [currentProjectId, setCurrentProjectId] = useState(() => {
    const match = window.location.pathname.match(/^\/projects\/([^/]+)/)
    const pathId = match && match[1] !== 'new' && !isNaN(Number(match[1])) ? match[1] : null
    if (pathId) return pathId
    const cached = localStorage.getItem('neuroforge_current_project_id')
    return cached && !isNaN(Number(cached)) ? cached : 'p1'
  })

  const [sidebarActivities, setSidebarActivities] = useState([])
  const [isActivitiesExpanded, setIsActivitiesExpanded] = useState(false)

  const currentProject = projects.find((p) => String(p.id) === String(currentProjectId))

  useEffect(() => {
    if (user?.orgId && (role === ROLES.ORG_ADMIN || role === ROLES.SUPER_ADMIN || role === ROLES.PROJECT_MANAGER)) {
      const pId = currentProjectId && !isNaN(Number(currentProjectId)) ? Number(currentProjectId) : null
      orgApi.listActivities(user.orgId, pId)
        .then((res) => {
          setSidebarActivities(Array.isArray(res.data) ? res.data.slice(0, 4) : [])
        })
        .catch(() => {})
    }
  }, [user?.orgId, role, currentProjectId])

  useEffect(() => {
    if (user?.orgId && role !== ROLES.SUPER_ADMIN) {
      projectApi.listProjects(user.orgId).then((res) => {
        setProjects(Array.isArray(res.data) ? res.data : [])
      }).catch(() => { })
    }
  }, [user?.orgId, role])

  useEffect(() => {
    const match = pathname.match(/^\/projects\/([^/]+)/)
    const pathProjectId = match && match[1] !== 'new' && !isNaN(Number(match[1])) ? match[1] : null

    if (pathProjectId) {
      localStorage.setItem('neuroforge_current_project_id', pathProjectId)
      setCurrentProjectId(pathProjectId)
    } else {
      const cached = localStorage.getItem('neuroforge_current_project_id')
      if (cached && !isNaN(Number(cached))) {
        setCurrentProjectId(cached)
      } else if (projects.length > 0) {
        localStorage.setItem('neuroforge_current_project_id', projects[0].id)
        setCurrentProjectId(projects[0].id)
      }
    }
  }, [pathname, projects])

  const handleProjectSelect = (e) => {
    const newProjectId = e.target.value
    setCurrentProjectId(newProjectId)
    localStorage.setItem('neuroforge_current_project_id', newProjectId)
    navigate(`/projects/${newProjectId}`)
  }

  const isSuperAdmin = role === ROLES.SUPER_ADMIN || user?.role === ROLES.SUPER_ADMIN
  const isUnassigned = !isSuperAdmin && !user?.orgId

  const [unassignedAdminsCount, setUnassignedAdminsCount] = useState(0)

  useEffect(() => {
    if (isSuperAdmin) {
      adminApi
        .getAllUsers()
        .then((res) => {
          if (Array.isArray(res.data)) {
            const count = res.data.filter(
              (u) =>
                (u.role === 'ORG_ADMIN' || u.role === ROLES.ORG_ADMIN) &&
                !u.organizationId &&
                !u.organizationName &&
                !u.orgId
            ).length
            setUnassignedAdminsCount(count)
          }
        })
        .catch(() => {})
    }
  }, [isSuperAdmin, pathname])

  const visibleSections = isUnassigned
    ? [
      {
        label: 'ACCOUNT STATUS',
        items: [{ to: '/dashboard', label: 'Overview', icon: LayoutDashboard }],
      },
    ]
    : getNavSections(currentProjectId, role, projects.length > 0, unassignedAdminsCount)
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
      }))
      .filter((section) => section.items.length > 0)

  const canCreateProject = !isUnassigned && [ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN].includes(role)

  return (
    <aside
      className="flex-shrink-0 bg-sidebar-bg text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800"
      style={{ width }}
    >
      {/* Draggable Edge */}
      <div
        onMouseDown={onMouseDown}
        className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 hover:bg-orange-500 transition-colors ${isResizing ? 'bg-orange-500' : 'bg-transparent'
          }`}
        style={{ transform: 'translateX(50%)' }}
      />

      {/* Brand Header */}
      <div className="min-h-[64px] py-3 flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold mr-3 shadow-sm flex-shrink-0">
          NF
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-white leading-tight">NeuroForge</span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">SDLC Platform</span>
          {!isSuperAdmin && user?.orgName && (
            <div className="mt-1.5 flex">
              <span className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-orange-400 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider truncate max-w-full" title={user.orgName}>
                🏢 {user.orgName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        {canCreateProject && (
          <NavLink
            to="/projects/new"
            className="flex items-center justify-center gap-2 bg-sidebar-hover text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors mb-6 border border-slate-700"
          >
            <Plus size={16} />
            New Project
          </NavLink>
        )}

        {visibleSections.map((section) => (
          <div key={section.label}>
            {section.label === 'CORE' && projects.length > 0 ? (
              <div className="mb-3">
                <div className="relative">
                  <select
                    value={currentProjectId || ''}
                    onChange={handleProjectSelect}
                    className="w-full appearance-none bg-sidebar-hover text-white text-sm py-2 pl-3 pr-8 rounded-lg border border-slate-700 focus:outline-none focus:border-accent cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-500 tracking-widest uppercase mb-3 px-2">
                {section.label}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                if (item.isActivities) {
                  const isActivitiesActive = pathname === '/activities'
                  return (
                    <div key={item.to} className="space-y-1">
                      {/* Dropdown Toggle Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsActivitiesExpanded((prev) => !prev)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group text-left cursor-pointer ${
                          isActivitiesActive
                            ? 'bg-sidebar-active text-white relative'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-sidebar-hover/50'
                        }`}
                        title={isActivitiesExpanded ? 'Collapse Recent Activities' : 'Expand Recent Activities'}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isActivitiesActive && (
                            <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-accent rounded-r-full" />
                          )}
                          <Icon
                            size={18}
                            className={
                              isActivitiesActive
                                ? 'text-accent'
                                : 'text-slate-500 group-hover:text-slate-400'
                            }
                          />
                          <span className="truncate">{item.label}</span>
                          {sidebarActivities.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                              {sidebarActivities.length}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-slate-500 group-hover:text-slate-300 transition-transform duration-200 shrink-0 ml-2 ${
                            isActivitiesExpanded ? 'rotate-0' : '-rotate-90'
                          }`}
                        />
                      </button>

                      {/* Dropdown Content */}
                      {isActivitiesExpanded && (
                        <div className="ml-3 pl-3 border-l border-slate-800 space-y-1.5 py-1.5 pr-1 animate-in fade-in duration-150">
                          {currentProject && (
                            <div className="text-[10px] text-slate-400 font-medium mb-1 px-1 truncate flex items-center gap-1" title={currentProject.name}>
                              <span>📁</span>
                              <span className="truncate">{currentProject.name}</span>
                            </div>
                          )}
                          {sidebarActivities.length === 0 ? (
                            <div className="text-[11px] text-slate-500 italic py-1 px-1">
                              No recent activities for this project
                            </div>
                          ) : (
                            sidebarActivities.map((act) => {
                              const isAccess =
                                act.action?.toLowerCase().includes('approve') ||
                                act.action?.toLowerCase().includes('join')
                              const isTeam =
                                act.action?.toLowerCase().includes('team') ||
                                act.action?.toLowerCase().includes('member')
                              const dotColor = isAccess ? 'bg-emerald-400' : isTeam ? 'bg-blue-400' : 'bg-orange-400'

                              return (
                                <Link
                                  key={act.id}
                                  to="/activities"
                                  className="block p-1.5 rounded-md hover:bg-slate-800/80 transition-colors group/item"
                                >
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />
                                    <span className="text-[11px] font-medium text-slate-300 group-hover/item:text-orange-400 truncate leading-tight">
                                      {act.action}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 pl-3">
                                    <span className="truncate max-w-[110px]">{act.actorEmail?.split('@')[0] || 'user'}</span>
                                    <span className="text-slate-500 font-mono">
                                      {act.createdAt
                                        ? new Date(act.createdAt).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : ''}
                                    </span>
                                  </div>
                                </Link>
                              )
                            })
                          )}
                          <Link
                            to="/activities"
                            className="block text-[10px] font-semibold text-orange-400 hover:text-orange-300 pl-1 pt-1 transition-colors"
                          >
                            View all activities →
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                        ? 'bg-sidebar-active text-white relative'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-sidebar-hover/50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-accent rounded-r-full" />}
                        <Icon size={18} className={isActive ? 'text-accent' : 'text-slate-500 group-hover:text-slate-400'} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge != null && item.badge > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white shadow-xs">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800">
        <Link to="/profile" className="flex items-center gap-3 bg-sidebar-hover/30 p-2 rounded-xl hover:bg-sidebar-hover transition-colors w-full text-left">
          <Avatar name={user?.fullName || '?'} size={36} className="rounded-full border border-slate-700" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user?.fullName || 'Guest'}</div>
            <div className="text-xs text-slate-400 truncate">{role?.replaceAll('_', ' ')}</div>
          </div>
        </Link>
      </div>
    </aside>
  )
}