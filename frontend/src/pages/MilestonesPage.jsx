import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import { extractErrorMessage } from '../api/client.js'
import {
  Flag,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  Zap,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

const MILESTONE_STATUS = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ACHIEVED', 'DELAYED']
const STATUS_COLORS = { 
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200', 
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200', 
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
  ACHIEVED: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold', 
  DELAYED: 'bg-red-100 text-red-700 border-red-200' 
}

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'

export default function MilestonesPage() {
  const { projectId } = useParams()
  const { role } = useAuth()
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [projectData, setProjectData] = useState(null)
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    expectedDeliveryDate: '',
    totalSprints: 1,
    status: 'PENDING'
  })

  const loadMilestones = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const [mRes, pRes] = await Promise.all([
        api.get(`/projects/${projectId}/milestones`),
        api.get(`/projects/${projectId}`).catch(() => ({ data: null }))
      ])
      setMilestones(mRes.data || [])
      setProjectData(pRes.data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadMilestones()
  }, [loadMilestones])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (projectData?.startDate && newMilestone.expectedDeliveryDate < projectData.startDate) {
      alert(`Milestone expected delivery date cannot be before project start date (${projectData.startDate})`)
      return
    }
    if (projectData?.endDate && newMilestone.expectedDeliveryDate > projectData.endDate) {
      alert(`Milestone expected delivery date cannot be after project deadline (${projectData.endDate})`)
      return
    }

    try {
      await api.post(`/projects/${projectId}/milestones`, {
        ...newMilestone,
        totalSprints: Math.max(1, parseInt(newMilestone.totalSprints) || 1),
        projectId: Number(projectId)
      })
      setNewModalOpen(false)
      setNewMilestone({ title: '', description: '', expectedDeliveryDate: '', totalSprints: 1, status: 'PENDING' })
      loadMilestones()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      const milestone = milestones.find(m => m.id === id)
      await api.put(`/projects/${projectId}/milestones/${id}`, {
        ...milestone,
        status,
        projectId: Number(projectId)
      })
      loadMilestones()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 w-full my-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading project milestones & sprint tracking...</p>
      </div>
    )
  }

  const isClient = role === ROLES.CLIENT
  const isDevQA = [ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER, ROLES.QA_TESTER].includes(role)
  const isOrgAdmin = role === ROLES.ORG_ADMIN || role === 'ORG_ADMIN'
  const canManage = !isClient && !isDevQA && !isOrgAdmin

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/projects" className="hover:text-orange-600 transition-colors">Projects</Link>
        <ChevronRight size={14} className="text-slate-400" />
        <Link to={`/projects/${projectId}`} className="hover:text-orange-600 transition-colors">
          {projectData?.name || `Project #${projectId}`}
        </Link>
        <ChevronRight size={14} className="text-slate-400" />
        <span className="text-slate-800 font-bold">Milestones</span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Flag className="text-orange-500" size={24} />
            Project Milestones
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated milestone completion linked to Kanban sprint deliveries. Once all required sprints are completed, milestones and project health automatically complete.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <button 
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs flex items-center gap-2" 
              onClick={() => setNewModalOpen(true)}
            >
              <Zap size={16} />
              Add Milestone
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Create Milestone Modal */}
      {newModalOpen && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Flag size={18} className="text-orange-500" />
            Create Milestone
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Specify milestone targets and the exact number of sprints required to achieve it.
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Milestone Title</label>
              <input 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" 
                placeholder="e.g. Phase 1 - Authentication & Core API" 
                value={newMilestone.title || ''} 
                onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })} 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[90px] bg-white" 
                placeholder="Key deliverables and scope for this milestone..." 
                value={newMilestone.description || ''} 
                onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  How many sprints are present for this milestone? <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="number"
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 pl-9 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white font-bold" 
                    placeholder="1"
                    value={newMilestone.totalSprints || 1} 
                    onChange={e => setNewMilestone({ ...newMilestone, totalSprints: Math.max(1, parseInt(e.target.value) || 1) })} 
                    required 
                  />
                  <Layers size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Once these sprints finish on the Kanban board, this milestone automatically completes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Delivery Date {projectData?.startDate && projectData?.endDate ? `(${projectData.startDate} to ${projectData.endDate})` : ''}
                </label>
                <div className="relative">
                  <input 
                    className="w-full px-3 py-2 pl-9 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" 
                    type="date" 
                    min={projectData?.startDate || undefined}
                    max={projectData?.endDate || undefined}
                    value={newMilestone.expectedDeliveryDate || ''} 
                    onChange={e => setNewMilestone({ ...newMilestone, expectedDeliveryDate: e.target.value })} 
                    required 
                  />
                  <Calendar size={16} className="absolute left-3 top-2.5 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs">
                Create Milestone
              </button>
              <button type="button" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors" onClick={() => setNewModalOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Milestones List */}
      <div className="space-y-4">
        {(!milestones || milestones.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Flag size={22} />
            </div>
            <p className="text-sm font-bold text-slate-700">No milestones defined yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Add a milestone and specify how many sprints are needed to complete it. The system will track sprints from the Kanban board.
            </p>
          </div>
        ) : (
          milestones.map(m => {
            const totalSprints = m.totalSprints || 1
            const completedSprints = m.completedSprints || 0
            const percent = Math.min(100, Math.round((completedSprints / totalSprints) * 100))
            const isCompleted = m.status === 'COMPLETED' || m.status === 'ACHIEVED'

            return (
              <div 
                key={m.id} 
                className={`bg-white rounded-2xl shadow-xs border transition-all p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  isCompleted ? 'border-emerald-200 bg-gradient-to-r from-white via-white to-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-slate-400">#M-{m.id}</span>
                    <h4 className="text-base font-bold text-slate-900">
                      {m.title || 'Untitled Milestone'}
                    </h4>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[m.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {formatEnum(m.status)}
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Sprints Completed
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {m.description || 'No description provided.'}
                  </p>

                  {/* Sprints Telemetry & Progress Strip */}
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 max-w-2xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Layers size={14} className="text-orange-500" />
                        <span>Sprints Required:</span>
                        <span className="text-slate-900 font-extrabold">{totalSprints}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {completedSprints} of {totalSprints} sprints finished ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Date details */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Expected: <strong className="text-slate-700">{m.expectedDeliveryDate || 'Not set'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span>Actual Delivery: <strong className={m.actualDeliveryDate ? 'text-emerald-700' : 'text-slate-500'}>{m.actualDeliveryDate || 'In Progress'}</strong></span>
                    </div>
                  </div>
                </div>
                
                {/* Status manual override if manager */}
                {canManage && (
                  <div className="md:border-l md:border-slate-100 md:pl-5 flex flex-col justify-center min-w-[150px]">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Status Override
                    </label>
                    <select 
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" 
                      value={m.status || ''} 
                      onChange={e => handleUpdateStatus(m.id, e.target.value)}
                    >
                      {MILESTONE_STATUS.map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
