import { IconSearch, IconBell } from './icons.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from './Avatar.jsx'
import './topbar.css'

export default function Topbar({ title, subtitle }) {
  const { user, role, logout } = useAuth()

  return (
    <header className="tb-shell">
      <div>
        <h1 className="tb-title">{title}</h1>
        {subtitle && <p className="tb-subtitle">{subtitle}</p>}
      </div>

      <div className="tb-actions">
        <div className="tb-search">
          <IconSearch size={14} />
          <input type="text" placeholder="Search…" />
        </div>

        <button className="tb-bell" aria-label="Notifications">
          <IconBell size={17} />
          <span className="tb-bell-dot" />
        </button>

        <Avatar name={user?.fullName || '?'} size={34} />

        <div className="tb-user-info">
          <div className="tb-user-role">{role?.replaceAll('_', ' ')}</div>
          <div className="tb-user-org">{user?.orgName || 'NeuroForge'}</div>
        </div>

        <button className="tb-signout" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  )
}