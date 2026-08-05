import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { IconPlus } from './icons.jsx'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { projectApi } from '../api/projectApi.js'
import './sidebar.css'

function getNavSections(currentProjectId) {
  return [
    {
      label: 'Workspace',
      items: [
        { to: '/dashboard', label: 'Dashboard', letter: 'D', color: '#2563eb', roles: null },
        { to: '/projects', label: 'Projects', letter: 'P', color: '#f5a623', roles: null },
        { to: `/projects/${currentProjectId}/specs`, label: 'Specs', letter: 'S', color: '#8b5cf6', roles: null },
        { to: `/projects/${currentProjectId}/backlog`, label: 'Backlog & Board', letter: 'B', color: '#14b8a6', roles: null },
      ],
    },
    {
      label: 'Organization',
      items: [
        { to: '/org/teams', label: 'Teams & Members', letter: 'T', color: '#f43f5e', roles: [ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN] },
        { to: '/org/settings', label: 'Org Settings', letter: 'O', color: '#64748b', roles: [ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN] },
      ],
    },
  ]
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const { user, role } = useAuth()
  const [currentProjectId, setCurrentProjectId] = useState(() => {
    const match = window.location.pathname.match(/^\/projects\/([^/]+)/)
    const pathId = match && match[1] !== 'new' && !isNaN(Number(match[1])) ? match[1] : null
    if (pathId) return pathId
    const cached = localStorage.getItem('neuroforge_current_project_id')
    return cached && !isNaN(Number(cached)) ? cached : (user?.currentProjectId || 'p1')
  })

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
      } else if (user?.orgId) {
        projectApi.listProjects(user.orgId).then((res) => {
          const firstProj = res.data?.[0]
          if (firstProj?.id) {
            localStorage.setItem('neuroforge_current_project_id', firstProj.id)
            setCurrentProjectId(firstProj.id)
          }
        }).catch(() => {})
      }
    }
  }, [pathname, user?.orgId])
  const visibleSections = getNavSections(currentProjectId)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)

  const canCreateProject = [ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN].includes(role)

  return (
    <aside className="sb-shell">
      <div className="sb-brand">
        <div className="sb-logo-box">NF</div>
        <div>
          <div className="sb-wordmark">NeuroForge</div>
          <div className="sb-org-pill" title={user?.orgName}>
            {user?.orgName || 'Organization'}
          </div>
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
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) => `sb-nav-item ${isActive ? 'sb-nav-item-active' : ''}`}
              >
                <span className="sb-nav-badge" style={{ background: item.color }}>{item.letter}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-footer">
        <p className="sb-nav-heading">SESSION</p>
        <div className="sb-session-role">{role?.replaceAll('_', ' ')}</div>
      </div>
    </aside>
  )
}