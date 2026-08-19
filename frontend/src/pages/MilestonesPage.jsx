import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import { extractErrorMessage } from '../api/client.js'

const MILESTONE_STATUS = ['PENDING', 'IN_PROGRESS', 'ACHIEVED', 'DELAYED']
const STATUS_COLORS = { 
  PENDING: 'bg-slate-100 text-slate-700', 
  IN_PROGRESS: 'bg-blue-100 text-blue-700', 
  ACHIEVED: 'bg-emerald-100 text-emerald-700', 
  DELAYED: 'bg-red-100 text-red-700' 
}

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';

export default function MilestonesPage() {
  const { projectId } = useParams()
  const { role } = useAuth()
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [projectData, setProjectData] = useState(null)
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', expectedDeliveryDate: '', status: 'PENDING' })

  const loadMilestones = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const [mRes, pRes] = await Promise.all([
        api.get(`/projects/${projectId}/milestones`),
        api.get(`/projects/${projectId}`).catch(() => ({ data: null }))
      ])
      setMilestones(mRes.data)
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
        projectId: Number(projectId)
      })
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

  if (loading) return <div className="p-6 text-sm text-slate-700">Loading milestones...</div>

  const isClient = role === ROLES.CLIENT
  const isDevQA = role === ROLES.DEVELOPER || role === ROLES.QA_TESTER
  const canManage = !isClient && !isDevQA

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Project Milestones</h1>
        <div className="flex flex-1 items-center justify-end gap-3">
          {canManage && (
            <button 
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm" 
              onClick={() => setNewModalOpen(true)}
            >
              Add Milestone
            </button>
          )}
        </div>
      </div>

      {error && <p className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">{error}</p>}

      {newModalOpen && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Create Milestone</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
              <input className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Title" value={newMilestone.title || ''} onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <textarea className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px]" placeholder="Description" value={newMilestone.description || ''} onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Expected Delivery Date {projectData?.startDate && projectData?.endDate ? `(Between ${projectData.startDate} and ${projectData.endDate})` : ''}
              </label>
              <input 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" 
                type="date" 
                min={projectData?.startDate || undefined}
                max={projectData?.endDate || undefined}
                value={newMilestone.expectedDeliveryDate || ''} 
                onChange={e => setNewMilestone({ ...newMilestone, expectedDeliveryDate: e.target.value })} 
                required 
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">Save</button>
              <button type="button" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors" onClick={() => setNewModalOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {(!milestones || milestones.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm font-medium text-slate-600">No milestones found</p>
            <p className="text-xs text-slate-400 mt-1">There are no milestones defined for this project yet.</p>
          </div>
        ) : (
          milestones.map(m => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:justify-between md:items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h4 className="text-base font-semibold text-slate-900">
                    {m.title || 'Untitled Milestone'}
                  </h4>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[m.status] || 'bg-slate-100 text-slate-700'}`}>
                    {formatEnum(m.status)}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mb-4">{m.description || 'No description provided.'}</p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-slate-50 rounded-lg border border-slate-100 p-5 flex-1 min-w-[150px]">
                    <p className="text-xs font-medium text-slate-500 mb-1">Expected</p>
                    <p className="text-sm text-slate-700 font-medium">{m.expectedDeliveryDate || 'Not set'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg border border-slate-100 p-5 flex-1 min-w-[150px]">
                    <p className="text-xs font-medium text-slate-500 mb-1">Actual</p>
                    <p className="text-sm text-slate-700 font-medium">{m.actualDeliveryDate || 'Pending'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex-shrink-0">
                {canManage && (
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-slate-500 mb-1">Update Status</label>
                    <select 
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" 
                      value={m.status || ''} 
                      onChange={e => handleUpdateStatus(m.id, e.target.value)}
                    >
                      <option value="" disabled>Select status</option>
                      {MILESTONE_STATUS.map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
