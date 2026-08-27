import { Bell, LogOut } from 'lucide-react'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../api/notificationApi.js'
import Avatar from './Avatar.jsx'

export default function Topbar({ title, subtitle }) {
  const { user, role, logout } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (user && user.orgApproved !== false) {
      fetchNotifications()
    }
  }, [user])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function fetchNotifications() {
    if (!user) return
    try {
      const [countRes, listRes] = await Promise.all([
        notificationApi.getUnreadCount(),
        notificationApi.getNotifications()
      ])
      setUnreadCount(countRes.data.count || 0)
      setNotifications(listRes.data.filter(n => !n.read))
    } catch (err) {
      console.error("Failed to load notifications", err)
    }
  }

  async function handleMarkAsRead(id) {
    try {
      await notificationApi.markAsRead(id)
      fetchNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <header className="h-18 min-h-[72px] bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-8 sticky top-0 z-20 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
      {/* Left side: Titles */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 font-medium">{subtitle}</p>}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-6">

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button 
            className="relative p-2 rounded-full hover:bg-slate-100 transition-colors" 
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} className="text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium text-orange-600">{unreadCount} unread</span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No notifications
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          if (!n.read) {
                            handleMarkAsRead(n.id)
                          }
                          if (n.type === 'TEAM_INVITE' && n.inviteToken) {
                            navigate(`/invite/${n.inviteToken}`)
                            setShowNotifications(false)
                          }
                        }}
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-orange-50/30' : ''}`}
                      >
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</h4>
                          {!n.read && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(n.id)
                              }}
                              className="text-[10px] text-orange-600 hover:text-orange-700 font-medium whitespace-nowrap"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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