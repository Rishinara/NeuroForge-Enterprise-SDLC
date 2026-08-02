import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import { extractErrorMessage } from '../api/client.js'

const MILESTONE_STATUS = ['PENDING', 'IN_PROGRESS', 'ACHIEVED', 'DELAYED']
const STATUS_COLORS = { PENDING: '#cbd5e1', IN_PROGRESS: '#3b82f6', ACHIEVED: '#10b981', DELAYED: '#ef4444' }

export default function MilestonesPage() {
  const { projectId } = useParams()
  const { role } = useAuth()
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', expectedDeliveryDate: '', status: 'PENDING' })

  const loadMilestones = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await api.get(`/projects/${projectId}/milestones`)
      setMilestones(res.data)
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
    try {
      await api.post(`/projects/${projectId}/milestones`, newMilestone)
      setNewModalOpen(false)
      setNewMilestone({ title: '', description: '', expectedDeliveryDate: '', status: 'PENDING' })
      loadMilestones()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      const milestone = milestones.find(m => m.id === id)
      await api.put(`/projects/${projectId}/milestones/${id}`, { ...milestone, status })
      loadMilestones()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading milestones...</div>

  const isClient = role === ROLES.CLIENT
  const isDevQA = role === ROLES.DEVELOPER || role === ROLES.QA_TESTER
  const canManage = !isClient && !isDevQA

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div className="wk-page-header">
        <h1 className="wk-page-title">Project Milestones</h1>
        {canManage && (
          <button className="wk-btn wk-btn-primary" onClick={() => setNewModalOpen(true)}>
            Add Milestone
          </button>
        )}
      </div>

      {error && <p className="wk-alert wk-alert-error" style={{ marginBottom: 20 }}>{error}</p>}

      {newModalOpen && (
        <div className="wk-card" style={{ marginBottom: 24 }}>
          <h3>Create Milestone</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <input className="wk-input" placeholder="Title" value={newMilestone.title} onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })} required />
            <textarea className="wk-textarea" placeholder="Description" value={newMilestone.description} onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })} />
            <input className="wk-input" type="date" value={newMilestone.expectedDeliveryDate} onChange={e => setNewMilestone({ ...newMilestone, expectedDeliveryDate: e.target.value })} required />
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="wk-btn wk-btn-primary">Save</button>
              <button type="button" className="wk-btn wk-btn-secondary" onClick={() => setNewModalOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {milestones.length === 0 ? (
          <p className="wk-empty">No milestones defined yet.</p>
        ) : (
          milestones.map(m => (
            <div key={m.id} className="wk-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#1e293b' }}>
                  {m.title}
                  <span style={{ marginLeft: 12, fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 999, background: STATUS_COLORS[m.status], color: '#fff' }}>
                    {m.status.replace('_', ' ')}
                  </span>
                </h4>
                <p style={{ margin: '0 0 4px 0', fontSize: 14, color: '#475569' }}>{m.description}</p>
                <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 16 }}>
                  <span><strong>Expected:</strong> {m.expectedDeliveryDate}</span>
                  {m.actualDeliveryDate && <span><strong>Actual:</strong> {m.actualDeliveryDate}</span>}
                </div>
              </div>
              
              <div>
                {canManage && (
                  <select 
                    className="wk-select" 
                    value={m.status} 
                    onChange={e => handleUpdateStatus(m.id, e.target.value)}
                  >
                    {MILESTONE_STATUS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
