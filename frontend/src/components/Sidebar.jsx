import { NavLink } from 'react-router-dom'
import { IconDashboard, IconProjects, IconUsers, IconSettings, IconLogout, IconPlus } from './icons.jsx'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Avatar from './Avatar.jsx'
import './sidebar.css'

const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: IconDashboard, roles: null },
      { to: '/projects', label: 'Projects', icon: IconProjects, roles: null },
    ],
  },
  {
    label: 'Organization',
    items: [
      { to: '/org/teams', label: 'Teams & Members', icon: IconUsers, roles: [ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN] },
      { to: '/org/settings', label: 'Org Settings', icon: IconSettings, roles: [ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN] },
    ],
  },
]

export default function Sidebar() {
  const { user, role, logout } = useAuth()

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
  })).filter((section) => section.items.length > 0)

  const canCreateProject = [ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN].includes(role)

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
            <p className="sb-nav-heading">{section.label}</p>
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