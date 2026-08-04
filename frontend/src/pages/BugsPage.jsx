import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import Avatar from '../components/Avatar.jsx'
import { extractErrorMessage } from '../api/client.js'

const BUG_STATUS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const PRIORITY_DOT = { LOW: '#3b82f6', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#7f1d1d' }

export default function BugsPage() {
  const { projectId } = useParams()
  const { role, user } = useAuth()
  const [bugs, setBugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newBugOpen, setNewBugOpen] = useState(false)
  const [newBug, setNewBug] = useState({ title: '', description: '', status: 'OPEN', priority: 'MEDIUM' })

  const loadBugs = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await api.get(`/projects/${projectId}/bugs`)
      setBugs(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadBugs()
  }, [loadBugs])

  const handleCreateBug = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/projects/${projectId}/bugs`, newBug)
      setNewBugOpen(false)
      setNewBug({ title: '', description: '', status: 'OPEN', priority: 'MEDIUM' })
      loadBugs()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  const handleUpdateStatus = async (bugId, status) => {
    try {
      const bug = bugs.find(b => b.id === bugId)
      await api.put(`/projects/${projectId}/bugs/${bugId}`, { ...bug, status })
      loadBugs()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading bugs...</div>

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div className="wk-page-header">
        <h1 className="wk-page-title">Bug Tracking</h1>
        {role !== ROLES.DEVELOPER && role !== ROLES.CLIENT && (
          <button className="wk-btn wk-btn-primary" onClick={() => setNewBugOpen(true)}>
            Report Bug
          </button>
        )}
      </div>

      {error && <p className="wk-alert wk-alert-error" style={{ marginBottom: 20 }}>{error}</p>}

      {newBugOpen && (
        <div className="wk-card" style={{ marginBottom: 24 }}>
          <h3>Report New Bug</h3>
          <form onSubmit={handleCreateBug} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <input className="wk-input" placeholder="Title" value={newBug.title} onChange={e => setNewBug({ ...newBug, title: e.target.value })} required />
            <textarea className="wk-textarea" placeholder="Description" value={newBug.description} onChange={e => setNewBug({ ...newBug, description: e.target.value })} />
            <select className="wk-select" value={newBug.priority} onChange={e => setNewBug({ ...newBug, priority: e.target.value })}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="wk-btn wk-btn-primary">Save</button>
              <button type="button" className="wk-btn wk-btn-secondary" onClick={() => setNewBugOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bugs.length === 0 ? (
          <p className="wk-empty">No bugs reported yet.</p>
        ) : (
          bugs.map(bug => (
            <div key={bug.id} className="wk-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 15, color: '#1e293b' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: PRIORITY_DOT[bug.priority], marginRight: 8 }} />
                  {bug.title}
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Reporter: {bug.reporterName} | Assignee: {bug.assigneeName || 'Unassigned'}</p>
              </div>
              
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {role !== ROLES.DEVELOPER && role !== ROLES.CLIENT ? (
                  <select 
                    className="wk-select" 
                    value={bug.status} 
                    onChange={e => handleUpdateStatus(bug.id, e.target.value)}
                  >
                    {BUG_STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 500, padding: '4px 8px', background: '#e2e8f0', borderRadius: 4 }}>
                    {bug.status.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
