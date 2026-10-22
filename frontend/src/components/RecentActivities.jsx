import { useState, useEffect, useMemo } from 'react'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { Activity, Clock, User, RefreshCw, Search, X, ShieldAlert, Download, Trash2 } from 'lucide-react'
import { exportActivitiesToPDF } from '../utils/pdfExport.js'

function timeAgo(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getActivityBadge(action = '') {
  const a = action.toLowerCase()
  if (a.includes('team') || a.includes('member') || a.includes('invite')) {
    return { bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800', label: 'TEAM' }
  }
  if (a.includes('approve') || a.includes('reject') || a.includes('join')) {
    return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800', label: 'ACCESS' }
  }
  if (a.includes('project') || a.includes('spec')) {
    return { bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800', label: 'PROJECT' }
  }
  if (a.includes('role') || a.includes('admin') || a.includes('setting')) {
    return { bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800', label: 'GOV' }
  }
  return { bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', label: 'EVENT' }
}

export default function RecentActivities({ projectId = null, onClose, className = '' }) {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const loadActivities = async (isManual = false) => {
    if (!user?.orgId || (user?.role !== ROLES.ORG_ADMIN && user?.role !== ROLES.SUPER_ADMIN && user?.role !== ROLES.PROJECT_MANAGER)) {
      setLoading(false)
      return
    }
    if (isManual) setRefreshing(true)
    setError('')
    try {
      const pId = projectId && !isNaN(Number(projectId)) ? Number(projectId) : null
      const res = await orgApi.listActivities(user.orgId, pId)
      setActivities(res.data || [])
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }

  useEffect(() => {
    loadActivities()
  }, [user?.orgId, user?.role, projectId])

  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return activities
    const q = searchQuery.toLowerCase()
    return activities.filter(
      (act) =>
        act.action?.toLowerCase().includes(q) ||
        act.details?.toLowerCase().includes(q) ||
        act.actorEmail?.toLowerCase().includes(q)
    )
  }, [activities, searchQuery])

  const handleDownloadPDF = () => {
    exportActivitiesToPDF({
      activities: filteredActivities,
      orgName: user?.orgName,
      orgSpecificId: user?.orgSpecificId,
      generatedBy: user?.fullName || user?.email,
    })
  }

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity log?')) return
    setDeletingId(activityId)
    setError('')
    try {
      await orgApi.deleteActivity(user.orgId, activityId)
      setActivities((prev) => prev.filter((a) => a.id !== activityId))
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear ALL recent activities for your organization? This action cannot be undone.')) {
      return
    }
    setClearing(true)
    setError('')
    try {
      await orgApi.clearAllActivities(user.orgId)
      setActivities([])
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setClearing(false)
    }
  }

  if (user?.role !== ROLES.ORG_ADMIN && user?.role !== ROLES.SUPER_ADMIN && user?.role !== ROLES.PROJECT_MANAGER) return null

  const canManageActivities = user?.role === ROLES.ORG_ADMIN || user?.role === ROLES.SUPER_ADMIN

  return (
    <aside
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden ${className}`}
      aria-label="Recent Activities Sidebar"
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-850/60">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Recent Activities
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300">
              {activities.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={activities.length === 0}
              className="px-2.5 py-1 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Download activities as PDF report"
            >
              <Download size={13} />
              <span className="hidden sm:inline">PDF</span>
            </button>

            {/* Clear All Activities Button (Admins only) */}
            {canManageActivities && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={activities.length === 0 || clearing}
                className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Clear all recent activities"
              >
                <Trash2 size={14} className={clearing ? 'animate-spin' : ''} />
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => loadActivities(true)}
              disabled={refreshing || loading}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Refresh activity feed"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin text-orange-500' : ''} />
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                title="Collapse activities sidebar"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Search Input */}
        <div className="relative mt-2">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Activity Timeline Content */}
      <div className="p-3 max-h-[calc(100vh-280px)] min-h-[300px] overflow-y-auto space-y-2.5 divide-y-0">
        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading activity feed…</p>
          </div>
        ) : error ? (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 text-xs flex items-start gap-2">
            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Activity size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">
              {searchQuery ? 'No activities match your search.' : 'No recent activities recorded yet.'}
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const badge = getActivityBadge(act.action)
            const isDeleting = deletingId === act.id

            return (
              <div
                key={act.id}
                className="group relative p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[11px] text-slate-400 flex items-center gap-1 font-medium whitespace-nowrap"
                      title={act.createdAt ? new Date(act.createdAt).toLocaleString() : ''}
                    >
                      <Clock size={11} />
                      {timeAgo(act.createdAt)}
                    </span>
                    {/* Delete Individual Activity */}
                    <button
                      type="button"
                      onClick={() => handleDeleteActivity(act.id)}
                      disabled={isDeleting}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-all cursor-pointer"
                      title="Delete this activity log"
                    >
                      <Trash2 size={12} className={isDeleting ? 'animate-spin text-red-600' : ''} />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 leading-snug">
                  {act.action}
                </h4>

                {act.details && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-2 leading-relaxed">
                    {act.details}
                  </p>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <User size={11} className="text-slate-400 shrink-0" />
                  <span className="truncate">{act.actorEmail || 'System'}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
