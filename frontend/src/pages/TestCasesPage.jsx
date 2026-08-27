import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import { extractErrorMessage } from '../api/client.js'

const TC_STATUS = ['PENDING', 'PASSED', 'FAILED', 'BLOCKED']
const STATUS_COLORS = { 
  PENDING: 'bg-slate-100 text-slate-700 border border-slate-200', 
  PASSED: 'bg-emerald-50 text-emerald-700 border border-emerald-200', 
  FAILED: 'bg-red-50 text-red-700 border border-red-200', 
  BLOCKED: 'bg-amber-50 text-amber-700 border border-amber-200' 
}

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';

export default function TestCasesPage() {
  const { projectId } = useParams()
  const { role } = useAuth()
  const [testCases, setTestCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newTcOpen, setNewTcOpen] = useState(false)
  const [newTc, setNewTc] = useState({ title: '', description: '', expectedResult: '', status: 'PENDING' })

  const loadTestCases = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await api.get(`/projects/${projectId}/test-cases`)
      setTestCases(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadTestCases()
  }, [loadTestCases])

  const handleCreateTc = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/projects/${projectId}/test-cases`, newTc)
      setNewTcOpen(false)
      setNewTc({ title: '', description: '', expectedResult: '', status: 'PENDING' })
      loadTestCases()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  const handleUpdateStatus = async (tcId, status) => {
    try {
      const tc = testCases.find(t => t.id === tcId)
      await api.put(`/projects/${projectId}/test-cases/${tcId}`, { ...tc, status })
      loadTestCases()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  if (loading) return <div className="p-6 text-slate-700">Loading test cases...</div>

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Test Execution</h1>
        <div className="flex items-center justify-end gap-3">
          {role !== ROLES.DEVELOPER && role !== ROLES.CLIENT && role !== ROLES.QA_TESTER && (
            <button 
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm" 
              onClick={() => setNewTcOpen(true)}
            >
              Add Test Case
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
          {error}
        </div>
      )}

      {newTcOpen && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Test Case</h3>
          <form onSubmit={handleCreateTc} className="flex flex-col gap-4">
            <input 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm" 
              placeholder="Title" 
              value={newTc.title} 
              onChange={e => setNewTc({ ...newTc, title: e.target.value })} 
              required 
            />
            <textarea 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[100px]" 
              placeholder="Description / Steps" 
              value={newTc.description} 
              onChange={e => setNewTc({ ...newTc, description: e.target.value })} 
            />
            <textarea 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[100px]" 
              placeholder="Expected Result" 
              value={newTc.expectedResult} 
              onChange={e => setNewTc({ ...newTc, expectedResult: e.target.value })} 
            />
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                Save
              </button>
              <button type="button" className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors" onClick={() => setNewTcOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testCases.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
            <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium text-slate-600">No test cases found</p>
            <p className="text-xs text-slate-400 mt-1">Add a new test case to get started.</p>
          </div>
        ) : (
          testCases.map(tc => (
            <div key={tc.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start gap-3">
                <h4 className="text-base font-semibold text-slate-900 leading-tight">{tc.title || 'Untitled Test Case'}</h4>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[tc.status] || 'bg-slate-100 text-slate-600'}`}>
                  {formatEnum(tc.status)}
                </span>
              </div>
              <p className="text-sm text-slate-700 flex-1 whitespace-pre-wrap">{tc.description || 'No description provided.'}</p>
              
              <div className="bg-slate-50 rounded-lg border border-slate-100 p-5 mt-2">
                <span className="text-xs font-medium text-slate-500 block mb-1">Expected Result</span>
                <p className="text-sm text-slate-700">{tc.expectedResult || 'N/A'}</p>
              </div>

              <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500">Assigned To</span>
                  <span className="text-sm text-slate-700">{tc.assignedTesterName || 'Unassigned'}</span>
                </div>
                
                {role !== ROLES.DEVELOPER && role !== ROLES.CLIENT && (
                  <select 
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer shadow-sm" 
                    value={tc.status || 'PENDING'} 
                    onChange={e => handleUpdateStatus(tc.id, e.target.value)}
                  >
                    {TC_STATUS.map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
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
