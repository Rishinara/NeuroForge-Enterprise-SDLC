import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { extractErrorMessage } from '../api/client.js'

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

  if (loading) return <div style={{ padding: 24 }}>Loading reports...</div>
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>
  if (!projectData) return null

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div className="wk-page-header">
        <h1 className="wk-page-title">Project Reports</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* Project Progress Report */}
        <div className="wk-card">
          <h3 style={{ marginTop: 0 }}>Overall Progress</h3>
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
             <div style={{ fontSize: 48, fontWeight: 'bold', color: '#0f172a' }}>
                 {projectData.progressPercent ?? 0}%
             </div>
             <p style={{ color: '#64748b', margin: 0 }}>Completion Rate</p>
          </div>
          <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
             <div style={{ width: `${projectData.progressPercent ?? 0}%`, height: '100%', background: '#3b82f6' }} />
          </div>
        </div>

        {/* Health Status */}
        <div className="wk-card">
          <h3 style={{ marginTop: 0 }}>Project Health</h3>
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
             <div style={{ 
                 fontSize: 32, 
                 fontWeight: 'bold', 
                 color: projectData.health === 'ON_TRACK' ? '#10b981' : projectData.health === 'AT_RISK' ? '#f59e0b' : '#ef4444' 
             }}>
                 {projectData.health.replace('_', ' ')}
             </div>
             <p style={{ color: '#64748b', margin: 0 }}>Current Status</p>
          </div>
        </div>

        {/* Additional Reports Placeholder */}
        <div className="wk-card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Velocity & Sprint Reports</h3>
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 8 }}>
            <p style={{ margin: 0 }}>Historical Sprint Velocity charts will appear here after sprints are completed.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
