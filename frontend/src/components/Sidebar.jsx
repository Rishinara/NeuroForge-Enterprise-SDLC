import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Folder, Users, Settings, LogOut, Plus, ChevronDown, Sparkles, CheckSquare, Flag, BarChart3, Layers } from 'lucide-react'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { projectApi } from '../api/projectApi.js'
import Avatar from './Avatar.jsx'

function getNavSections(currentProjectId, role, hasProjects) {
  if (role === ROLES.SUPER_ADMIN) {
    return [
      {
        label: 'Platform Administration',
        items: [
          { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: null },
          { to: '/projects', label: 'Projects Portfolio', icon: Folder, roles: null },
          { to: '/org/teams', label: 'Users & Admins', icon: Users, roles: null },
          { to: '/organizations', label: 'Organizations', icon: Folder, roles: null },
          { to: '/admin/settings', label: 'Settings', icon: Settings, roles: null },
        ],
      },
    ]
  }

  const workspaceItems = [
    { to: '/dashboard', label: role === ROLES.CLIENT ? 'Client Dashboard' : 'Dashboard', icon: LayoutDashboard, roles: null },
    { to: '/projects', label: 'Projects', icon: Folder, roles: null },
  ]

  if (hasProjects) {
    workspaceItems.push(
      { to: `/projects/${currentProjectId}/approvals`, label: 'Request Approvals', icon: CheckSquare, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.PROJECT_MANAGER, ROLES.CLIENT] },
      { to: `/projects/${currentProjectId}/specs`, label: 'AI Spec Studio', icon: Sparkles, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.QA_TESTER, ROLES.CLIENT] },
      { to: `/projects/${currentProjectId}/backlog`, label: 'Backlog & Board', icon: Layers, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.QA_TESTER] },
      { to: `/projects/${currentProjectId}/bugs`, label: 'Bugs', icon: Folder, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.QA_TESTER] },
      { to: `/projects/${currentProjectId}/milestones`, label: 'Milestones', icon: Flag, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.QA_TESTER, ROLES.CLIENT] },
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
        { to: '/org/teams', label: 'Teams & Members', icon: Users, roles: [ROLES.ORG_ADMIN, ROLES.PROJECT_MANAGER] },
        { to: '/org/invites', label: 'Pending Invites', icon: Users, roles: [ROLES.ORG_ADMIN] },
        { to: '/org/settings', label: 'Org Settings', icon: Settings, roles: [ROLES.ORG_ADMIN] },
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

  const visibleSections = isUnassigned
    ? [
      {
        label: 'ACCOUNT STATUS',
        items: [{ to: '/dashboard', label: 'Overview', icon: LayoutDashboard }],
      },
    ]
    : getNavSections(currentProjectId, role, projects.length > 0)
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
                        {item.label}
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