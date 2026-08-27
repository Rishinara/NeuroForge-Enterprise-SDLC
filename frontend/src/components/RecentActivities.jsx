import { useState, useEffect } from 'react'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { Activity, Clock, User } from 'lucide-react'

export default function RecentActivities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Only Org Admins and Super Admins should see this
    if (!user?.orgId || (user?.role !== ROLES.ORG_ADMIN && user?.role !== ROLES.SUPER_ADMIN)) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const res = await orgApi.listActivities(user.orgId)
        setActivities(res.data || [])
      } catch (err) {
        setError(extractErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-8 text-center mt-6">
        <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Loading workspace activities...</p>
      </div>
    )
  }

  if (user?.role !== ROLES.ORG_ADMIN && user?.role !== ROLES.SUPER_ADMIN) return null
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 text-xs mt-6">
        {error}
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-8 text-center mt-6">
        <Activity size={24} className="text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-400 font-medium">No recent organization activities found.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-6 shadow-xs mt-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 mb-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity size={18} className="text-orange-500" />
          Recent Activities
        </h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {activities.length} Events
        </span>
      </div>

      <div className="space-y-3">
        {activities.map((act) => (
          <div
            key={act.id}
            className="p-3.5 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
          >
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                {act.action}
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Clock size={12} />
                {new Date(act.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              {act.details}
            </p>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <User size={12} className="text-slate-400" />
              <span>By: {act.actorEmail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
