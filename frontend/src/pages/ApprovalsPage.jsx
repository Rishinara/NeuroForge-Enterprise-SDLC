import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import { extractErrorMessage } from '../api/client.js'

const APPROVAL_STATUS = ['PENDING', 'APPROVED', 'REJECTED']
const ENTITY_TYPES = ['SPECIFICATION', 'DELIVERABLE', 'MILESTONE']
const STATUS_COLORS = { PENDING: '#cbd5e1', APPROVED: '#10b981', REJECTED: '#ef4444' }

export default function ApprovalsPage() {
  const { projectId } = useParams()
  const { role } = useAuth()
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [newApproval, setNewApproval] = useState({ entityType: 'DELIVERABLE', entityId: 1, status: 'PENDING', comments: '' })

  const loadApprovals = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await api.get(`/projects/${projectId}/approvals`)
      setApprovals(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadApprovals()
  }, [loadApprovals])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/projects/${projectId}/approvals`, newApproval)
      setNewModalOpen(false)
      setNewApproval({ entityType: 'DELIVERABLE', entityId: 1, status: 'PENDING', comments: '' })
      loadApprovals()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading approvals...</div>

  const isClientOrPM = role === ROLES.CLIENT || role === ROLES.PROJECT_MANAGER || role === ROLES.SUPER_ADMIN

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div className="wk-page-header">
        <h1 className="wk-page-title">Client Approvals</h1>
        {isClientOrPM && (
          <button className="wk-btn wk-btn-primary" onClick={() => setNewModalOpen(true)}>
            Register Approval
          </button>
        )}
      </div>

      {error && <p className="wk-alert wk-alert-error" style={{ marginBottom: 20 }}>{error}</p>}

      {newModalOpen && (
        <div className="wk-card" style={{ marginBottom: 24 }}>
          <h3>Register Approval</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            
            <div style={{ display: 'flex', gap: 12 }}>
                <select className="wk-select" style={{ flex: 1 }} value={newApproval.entityType} onChange={e => setNewApproval({ ...newApproval, entityType: e.target.value })}>
                  {ENTITY_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="wk-input" style={{ flex: 1 }} type="number" placeholder="Entity ID" value={newApproval.entityId} onChange={e => setNewApproval({ ...newApproval, entityId: e.target.value })} required />
            </div>

            <select className="wk-select" value={newApproval.status} onChange={e => setNewApproval({ ...newApproval, status: e.target.value })}>
              {APPROVAL_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <textarea className="wk-textarea" placeholder="Comments" value={newApproval.comments} onChange={e => setNewApproval({ ...newApproval, comments: e.target.value })} />
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="wk-btn wk-btn-primary">Save</button>
              <button type="button" className="wk-btn wk-btn-secondary" onClick={() => setNewModalOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {approvals.length === 0 ? (
          <p className="wk-empty">No approvals registered yet.</p>
        ) : (
          approvals.map(a => (
            <div key={a.id} className="wk-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#1e293b' }}>
                  {a.entityType} #{a.entityId}
                  <span style={{ marginLeft: 12, fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 999, background: STATUS_COLORS[a.status], color: '#fff' }}>
                    {a.status}
                  </span>
                </h4>
                <p style={{ margin: '0 0 4px 0', fontSize: 14, color: '#475569' }}>{a.comments || 'No comments'}</p>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Registered by {a.clientName}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
