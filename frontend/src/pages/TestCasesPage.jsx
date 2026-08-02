import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES } from '../context/AuthContext.jsx'
import { api } from '../api/client.js'
import { extractErrorMessage } from '../api/client.js'

const TC_STATUS = ['PENDING', 'PASSED', 'FAILED', 'BLOCKED']
const STATUS_COLORS = { PENDING: '#cbd5e1', PASSED: '#10b981', FAILED: '#ef4444', BLOCKED: '#f59e0b' }

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

  if (loading) return <div style={{ padding: 24 }}>Loading test cases...</div>

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div className="wk-page-header">
        <h1 className="wk-page-title">Test Execution</h1>
        {role !== ROLES.DEVELOPER && role !== ROLES.CLIENT && role !== ROLES.QA_TESTER && (
          <button className="wk-btn wk-btn-primary" onClick={() => setNewTcOpen(true)}>
            Add Test Case
          </button>
        )}
      </div>

      {error && <p className="wk-alert wk-alert-error" style={{ marginBottom: 20 }}>{error}</p>}

      {newTcOpen && (
        <div className="wk-card" style={{ marginBottom: 24 }}>
          <h3>Add New Test Case</h3>
          <form onSubmit={handleCreateTc} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            <input className="wk-input" placeholder="Title" value={newTc.title} onChange={e => setNewTc({ ...newTc, title: e.target.value })} required />
            <textarea className="wk-textarea" placeholder="Description / Steps" value={newTc.description} onChange={e => setNewTc({ ...newTc, description: e.target.value })} />
            <textarea className="wk-textarea" placeholder="Expected Result" value={newTc.expectedResult} onChange={e => setNewTc({ ...newTc, expectedResult: e.target.value })} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="wk-btn wk-btn-primary">Save</button>
              <button type="button" className="wk-btn wk-btn-secondary" onClick={() => setNewTcOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {testCases.length === 0 ? (
          <p className="wk-empty" style={{ gridColumn: '1 / -1' }}>No test cases created yet.</p>
        ) : (
          testCases.map(tc => (
            <div key={tc.id} className="wk-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ margin: 0, fontSize: 15, color: '#1e293b' }}>{tc.title}</h4>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 999, background: STATUS_COLORS[tc.status], color: '#fff' }}>
                  {tc.status}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, color: '#475569', flex: 1 }}>{tc.description}</p>
              <div style={{ background: '#f8fafc', padding: 8, borderRadius: 6, fontSize: 13, color: '#334155' }}>
                <strong>Expected:</strong> {tc.expectedResult || 'N/A'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>Assigned: {tc.assignedTesterName || 'Unassigned'}</span>
                {role !== ROLES.DEVELOPER && role !== ROLES.CLIENT && (
                  <select 
                    className="wk-select" 
                    value={tc.status} 
                    onChange={e => handleUpdateStatus(tc.id, e.target.value)}
                    style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                  >
                    {TC_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
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
