import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api, extractErrorMessage } from '../api/client.js'

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';

export default function ReportsPage() {
  const { projectId } = useParams()
  const [projectData, setProjectData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await api.get(`/projects/${projectId}`)
      setProjectData(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  if (loading) return <div className="p-6 text-sm text-slate-700">Loading reports...</div>
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>
  if (!projectData) return null

  const progress = projectData.progressPercent ?? 0;
  const healthStatus = projectData.health || 'UNKNOWN';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Project Reports</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Project Progress Report */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col justify-between">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Overall Progress</h3>
          <div className="flex-1 flex flex-col items-center justify-center py-6">
             <div className="text-5xl font-bold text-slate-900 mb-2">
                 {progress}%
             </div>
             <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completion Rate</p>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-4">
             <div 
               className="h-full bg-orange-500 rounded-full transition-all duration-500" 
               style={{ width: `${progress}%` }} 
             />
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Project Health</h3>
          <div className="flex-1 flex flex-col items-center justify-center py-6">
             <div className={`text-4xl font-bold mb-2 ${healthStatus === 'ON_TRACK' ? 'text-emerald-600' : healthStatus === 'AT_RISK' ? 'text-amber-500' : healthStatus === 'UNKNOWN' ? 'text-slate-400' : 'text-red-500'}`}>
                 {formatEnum(healthStatus)}
             </div>
             <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Current Status</p>
          </div>
        </div>

        {/* Additional Reports Placeholder */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-6">Velocity & Sprint Reports</h3>
          
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm font-medium text-slate-600">No reports generated</p>
            <p className="text-xs text-slate-400 mt-1">Historical Sprint Velocity charts will appear here after sprints are completed.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
