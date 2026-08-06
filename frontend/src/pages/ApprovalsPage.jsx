import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import { extractErrorMessage } from '../api/client.js'

const APPROVAL_STATUS = ['PENDING', 'APPROVED', 'REJECTED']
const ENTITY_TYPES = ['SPECIFICATION', 'DELIVERABLE', 'MILESTONE']
const STATUS_COLORS = { 
  PENDING: 'bg-slate-100 text-slate-700 border border-slate-200', 
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
  REJECTED: 'bg-red-50 text-red-700 border border-red-200' 
}

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'

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

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto min-h-[400px] flex items-center justify-center">
        <div className="text-sm font-medium text-slate-500">Loading approvals...</div>
      </div>
    )
  }

  const isClientOrPM = role === ROLES.CLIENT || role === ROLES.PROJECT_MANAGER || role === ROLES.SUPER_ADMIN

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Client Approvals</h1>
        <div className="flex items-center justify-end gap-3">
          {isClientOrPM && (
            <button 
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              onClick={() => setNewModalOpen(true)}
            >
              Register Approval
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {newModalOpen && (
        <div className="bg-slate-50 rounded-lg border border-slate-100 p-5">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Register Approval</h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            
            <div className="flex flex-col sm:flex-row gap-4">
                <select 
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white" 
                  value={newApproval.entityType || ''} 
                  onChange={e => setNewApproval({ ...newApproval, entityType: e.target.value })}
                >
                  {ENTITY_TYPES.map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
                </select>
                <input 
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                  type="number" 
                  placeholder="Entity ID" 
                  value={newApproval.entityId ?? ''} 
                  onChange={e => setNewApproval({ ...newApproval, entityId: e.target.value })} 
                  required 
                />
            </div>

            <select 
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white" 
              value={newApproval.status || ''} 
              onChange={e => setNewApproval({ ...newApproval, status: e.target.value })}
            >
              {APPROVAL_STATUS.map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
            </select>

            <textarea 
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[100px]" 
              placeholder="Comments" 
              value={newApproval.comments || ''} 
              onChange={e => setNewApproval({ ...newApproval, comments: e.target.value })} 
            />
            
            <div className="flex items-center gap-3">
              <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                Save
              </button>
              <button type="button" className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium rounded-lg transition-colors shadow-sm" onClick={() => setNewModalOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-slate-600">No approvals found</p>
            <p className="text-xs text-slate-400 mt-1">There are currently no approvals registered for this project.</p>
          </div>
        ) : (
          approvals.map(a => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h4 className="text-base font-semibold text-slate-900">
                    {formatEnum(a.entityType)} #{a.entityId ?? 'Unknown'}
                  </h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                    {formatEnum(a.status)}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{a.comments || 'No comments provided'}</p>
                <div className="text-xs font-medium text-slate-500">
                  Registered by {a.clientName || 'Unknown user'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

