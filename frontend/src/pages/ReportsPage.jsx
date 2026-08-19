import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api, extractErrorMessage } from '../api/client.js'
import {
  TrendingUp,
  BarChart2,
  CheckCircle2,
  Zap,
  Award
} from 'lucide-react'

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';

export default function ReportsPage() {
  const { projectId } = useParams()
  const [projectData, setProjectData] = useState(null)
  const [sprintMetrics, setSprintMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      const projRes = await api.get(`/projects/${projectId}`).catch(() => ({ data: null }))
      setProjectData(projRes.data)

      // Fetch sprints for this project
      const sprintRes = await api.get(`/sprints/project/${projectId}`).catch(() => ({ data: [] }))
      const sprintsList = Array.isArray(sprintRes.data) ? sprintRes.data : []

      // Fetch board task details for each sprint
      const boards = await Promise.all(
        sprintsList.map(async (sprint) => {
          try {
            const boardRes = await api.get(`/tasks/${sprint.id}/board`)
            const board = boardRes.data || {}
            const todo = board.todo || []
            const inProgress = board.inProgress || []
            const codeReview = board.codeReview || []
            const testing = board.testing || []
            const done = board.done || []

            const allTasks = [...todo, ...inProgress, ...codeReview, ...testing, ...done]
            const completedTasks = done

            const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0)
            const totalPoints = allTasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0)
            const totalTasksCount = allTasks.length
            const completedTasksCount = completedTasks.length

            const isAutoCompleted = totalTasksCount > 0 && completedTasksCount === totalTasksCount
            const effectiveStatus = isAutoCompleted ? 'COMPLETED' : sprint.status

            return {
              ...sprint,
              status: effectiveStatus,
              totalTasks: totalTasksCount,
              completedTasks: completedTasksCount,
              completedPoints,
              totalPoints,
              velocity: completedPoints,
              completionRate: totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0
            }
          } catch {
            return {
              ...sprint,
              totalTasks: 0,
              completedTasks: 0,
              completedPoints: 0,
              totalPoints: 0,
              velocity: 0,
              completionRate: 0
            }
          }
        })
      )
      setSprintMetrics(boards)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 max-w-6xl mx-auto my-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
        <p className="text-sm font-medium text-slate-500">Loading project velocity & analytics reports...</p>
      </div>
    )
  }

  if (error) return <div className="p-6 text-sm text-red-600 max-w-6xl mx-auto">{error}</div>
  if (!projectData) return null

  const progress = projectData.progressPercent ?? 0;
  const healthStatus = projectData.health || 'UNKNOWN';

  const completedSprints = sprintMetrics.filter((s) => s.status === 'COMPLETED' || s.completedTasks > 0);
  const totalCompletedSprintsCount = sprintMetrics.filter((s) => s.status === 'COMPLETED').length;
  
  const totalDeliveredPoints = completedSprints.reduce((sum, s) => sum + s.completedPoints, 0);
  const averageVelocity = totalCompletedSprintsCount > 0
    ? (totalDeliveredPoints / totalCompletedSprintsCount).toFixed(1)
    : 0;

  const maxVelocity = Math.max(...sprintMetrics.map((s) => s.velocity), 10);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart2 className="text-orange-500" size={26} />
            Project Reports & Velocity Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time delivery progress, health indicators, and automated sprint velocity tracking.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Project Progress Report */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-blue-500" size={18} />
              Overall Project Progress
            </h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              {progress}% Complete
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
             <div className="text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">
                 {progress}%
             </div>
             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Completion Rate</p>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mt-4">
             <div 
               className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500 shadow-xs" 
               style={{ width: `${progress}%` }} 
             />
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Award className="text-emerald-500" size={18} />
              Project Health & Status
            </h3>
            <span className="text-xs font-medium text-slate-400">Automated Indicator</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
             <div className={`text-4xl font-extrabold mb-2 ${healthStatus === 'ON_TRACK' ? 'text-emerald-600' : healthStatus === 'AT_RISK' ? 'text-amber-500' : healthStatus === 'UNKNOWN' ? 'text-slate-400' : 'text-red-500'}`}>
                 {formatEnum(healthStatus)}
             </div>
             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Health Status</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 flex items-center justify-between border border-slate-100">
            <span>Overall project delivery status based on milestone progress.</span>
          </div>
        </div>

        {/* Velocity & Sprint Analytics Section */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap className="text-amber-500" size={20} />
                Velocity & Sprint Analytics
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Automated sprint completion metrics and story point delivery velocity.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <Zap size={14} className="text-amber-600" />
                Avg Velocity: <span className="text-sm font-bold">{averageVelocity}</span> pts/sprint
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Completed Sprints: <span className="text-sm font-bold">{totalCompletedSprintsCount}</span>
              </div>
            </div>
          </div>

          {sprintMetrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
              <Zap className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">No Sprints Defined</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Create sprints and add tasks under Backlog & Board. When all tasks in a sprint are completed, its velocity will calculate here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Visual Velocity Bar Chart */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Sprint Velocity Bar Chart</h4>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {sprintMetrics.map((s) => (
                    <div key={s.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{s.name}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : s.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-200 text-slate-700'}`}>
                            {s.status}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-600">
                          {s.completedPoints} / {s.totalPoints} pts ({s.completionRate}%)
                        </div>
                      </div>

                      <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${maxVelocity > 0 ? (s.completedPoints / maxVelocity) * 100 : 0}%` }}
                          title={`Completed: ${s.completedPoints} pts`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sprint Performance Breakdown Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <th className="p-3">Sprint Name</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Tasks Completed</th>
                      <th className="p-3">Story Points</th>
                      <th className="p-3">Calculated Velocity</th>
                      <th className="p-3">Dates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {sprintMetrics.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{s.name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : s.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-700">{s.completedTasks} / {s.totalTasks} tasks</td>
                        <td className="p-3 font-medium text-slate-700">{s.completedPoints} / {s.totalPoints} pts</td>
                        <td className="p-3 font-extrabold text-emerald-600">{s.velocity} pts</td>
                        <td className="p-3 text-slate-500">{s.startDate || 'TBD'} to {s.endDate || 'TBD'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
