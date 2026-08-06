import { Bell, Search, LogOut } from 'lucide-react'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Avatar from './Avatar.jsx'

export default function Topbar({ title, subtitle }) {
  const { user, role, logout } = useAuth()


  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      {/* Left side: Titles */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-accent focus-within:bg-white transition-all">
          <Search size={16} className="text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search…" 
            className="bg-transparent border-none outline-none text-sm w-48 text-slate-700 placeholder-slate-400"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors" aria-label="Notifications">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-yellow-400 border-2 border-white rounded-full"></span>
        </button>

        <div className="w-px h-8 bg-slate-200"></div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <Avatar name={user?.fullName || 'User'} size={40} />
          <div className="hidden sm:block text-right mr-2">
            <div className="text-sm font-semibold text-slate-900">{user?.fullName || 'User'}</div>
            <div className="text-xs text-slate-500">{role?.replaceAll('_', ' ') || 'Member'}</div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-3 py-1.5 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-medium transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  )
}