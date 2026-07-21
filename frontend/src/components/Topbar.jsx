import { IconSearch, IconBell } from './icons.jsx'
import './topbar.css'

export default function Topbar({ title, subtitle }) {
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
      </div>
    </header>
  )
}