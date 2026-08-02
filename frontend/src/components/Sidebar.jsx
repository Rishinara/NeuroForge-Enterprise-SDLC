import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { IconDashboard, IconProjects, IconUsers, IconSettings, IconLogout, IconPlus } from './icons.jsx'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { projectApi } from '../api/projectApi.js'
import Avatar from './Avatar.jsx'
import './sidebar.css'

function getNavSections(currentProjectId, role, hasProjects) {
  if (role === ROLES.SUPER_ADMIN) {
    return [
      {
        label: 'Platform Administration',
        items: [
          { to: '/dashboard', label: 'Overview', icon: IconDashboard, roles: null },
          { to: '/projects', label: 'Projects Portfolio', icon: IconProjects, roles: null },
          { to: '/org/teams', label: 'Users & Org Admins', icon: IconUsers, roles: null },
          { to: '/org/settings', label: 'Organizations & Settings', icon: IconSettings, roles: null },
          { to: '/profile', label: 'Profile', icon: IconSettings, roles: null },
        ],
      },
    ]
  }

  const workspaceItems = [
    { to: '/dashboard', label: 'Dashboard', icon: IconDashboard, roles: null },
    { to: '/projects', label: 'Projects', icon: IconProjects, roles: null },
  ]
  
  if (hasProjects) {
    workspaceItems.push(
      { to: `/projects/${currentProjectId}/specs`, label: 'Specs', icon: IconProjects, roles: null },
      { to: `/projects/${currentProjectId}/backlog`, label: 'Backlog & Board', icon: IconDashboard, roles: null },
      { to: `/projects/${currentProjectId}/bugs`, label: 'Bugs', icon: IconProjects, roles: null },
      { to: `/projects/${currentProjectId}/test-cases`, label: 'Test Cases', icon: IconProjects, roles: null },
      { to: `/projects/${currentProjectId}/milestones`, label: 'Milestones', icon: IconProjects, roles: null },
      { to: `/projects/${currentProjectId}/approvals`, label: 'Approvals', icon: IconProjects, roles: null },
      { to: `/projects/${currentProjectId}/reports`, label: 'Reports', icon: IconDashboard, roles: null }
    )
  }

  return [
    {
      label: 'Workspace',
      items: workspaceItems,
    },
    {
      label: 'Organization',
      items: [
        { to: '/org/teams', label: 'Teams & Members', icon: IconUsers, roles: [ROLES.ORG_ADMIN, ROLES.PROJECT_MANAGER] },
        { to: '/org/invites', label: 'Pending Invites', icon: IconUsers, roles: [ROLES.ORG_ADMIN] },
        { to: '/org/settings', label: 'Org Settings', icon: IconSettings, roles: [ROLES.ORG_ADMIN] },
      ],
    },
  ]
}

export default function Sidebar() {
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
      }).catch(() => {})
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
    
    const match = pathname.match(/^\/projects\/[^/]+(.*)/)
    if (match) {
      navigate(`/projects/${newProjectId}${match[1]}`)
    } else {
      navigate(`/projects/${newProjectId}/backlog`)
    }
  }

  const isSuperAdmin = role === ROLES.SUPER_ADMIN || user?.role === ROLES.SUPER_ADMIN
  const isUnassigned = !isSuperAdmin && !user?.orgId

  const visibleSections = isUnassigned
    ? [
        {
          label: 'Account Status',
          items: [{ to: '/dashboard', label: 'Overview', icon: IconDashboard }],
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
    <aside className="sb-shell">
      <div className="sb-brand">
        <div className="sb-wordmark">
          <span className="sb-wordmark-dot" />
          NeuroForge
        </div>
        <div className="sb-org-pill" title={user?.orgName}>
          {user?.orgName || 'Organization'}
        </div>
      </div>

      {canCreateProject && (
        <NavLink to="/projects/new" className="sb-cta">
          <IconPlus size={15} strokeWidth={2.5} />
          New project
        </NavLink>
      )}

      <nav className="sb-nav">
        {visibleSections.map((section) => (
          <div key={section.label} className="sb-nav-section">
            {section.label === 'Workspace' && projects.length > 0 ? (
              <div style={{ marginBottom: 8, padding: '0 12px' }}>
                <select
                  value={currentProjectId || ''}
                  onChange={handleProjectSelect}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#0f172a',
                    cursor: 'pointer',
                  }}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="sb-nav-heading">{section.label}</p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) => `sb-nav-item ${isActive ? 'sb-nav-item-active' : ''}`}
                >
                  <Icon size={16} strokeWidth={2} />
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sb-footer">
        <div className="sb-user-card">
          <Avatar name={user?.fullName || '?'} size={34} />
          <div className="sb-user-info">
            <div className="sb-user-name">{user?.fullName}</div>
            <div className="sb-user-role">{role?.replaceAll('_', ' ')}</div>
          </div>
          <button className="sb-logout-icon" onClick={logout} title="Log out" aria-label="Log out">
            <IconLogout size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}