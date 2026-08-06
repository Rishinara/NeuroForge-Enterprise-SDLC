import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import Avatar from '../components/Avatar.jsx'
import { extractErrorMessage } from '../api/client.js'

const BUG_STATUS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
const PRIORITY_DOT = { LOW: '#3b82f6', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#7f1d1d' }

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';

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

  if (loading) return <div className="p-6 text-sm text-slate-700">Loading bugs...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Bug Tracking</h1>
        {role !== ROLES.DEVELOPER && role !== ROLES.CLIENT && (
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={() => setNewBugOpen(true)}
          >
            Report Bug
          </button>
        )}
      </div>

      {error && <p className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{error}</p>}

      {newBugOpen && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Report New Bug</h3>
          <form onSubmit={handleCreateBug} className="flex flex-col gap-4">
            <input 
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Title" 
              value={newBug.title} 
              onChange={e => setNewBug({ ...newBug, title: e.target.value })} 
              required 
            />
            <textarea 
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 min-h-[100px]"
              placeholder="Description" 
              value={newBug.description} 
              onChange={e => setNewBug({ ...newBug, description: e.target.value })} 
            />
            <select 
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-white"
              value={newBug.priority} 
              onChange={e => setNewBug({ ...newBug, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <div className="flex gap-3 mt-2">
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Save
              </button>
              <button type="button" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors" onClick={() => setNewBugOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {bugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-medium text-slate-600">No bugs reported yet</p>
            <p className="text-xs text-slate-400 mt-1">There are no bugs currently tracked in this project.</p>
          </div>
        ) : (
          bugs.map(bug => (
            <div key={bug.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
              <div>
                <h4 className="text-base font-semibold text-slate-900 mb-1 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full mr-2.5" style={{ backgroundColor: PRIORITY_DOT[bug.priority] || '#94a3b8' }} />
                  {bug.title || 'Untitled Bug'}
                </h4>
                <p className="text-xs font-medium text-slate-500">
                  Reporter: {bug.reporterName || 'Unknown'} <span className="mx-1.5 text-slate-300">•</span> Assignee: {bug.assigneeName || 'Unassigned'}
                </p>
              </div>
              
              <div className="flex gap-3 items-center">
                {role !== ROLES.DEVELOPER && role !== ROLES.CLIENT ? (
                  <select 
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 cursor-pointer" 
                    value={bug.status || 'OPEN'} 
                    onChange={e => handleUpdateStatus(bug.id, e.target.value)}
                  >
                    {BUG_STATUS.map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
                  </select>
                ) : (
                  <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    {formatEnum(bug.status)}
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
