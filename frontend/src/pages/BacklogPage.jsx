import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { taskApi } from '../api/taskApi.js'
import { sprintApi } from '../api/sprintApi.js'
import { projectApi } from '../api/projectApi.js'
import { aiApi } from '../api/aiApi.js'
import { api, extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Can from '../components/Can.jsx'
import './agile.css'

const PRIORITY_STYLE = {
  CRITICAL: { bg: '#fee2e2', color: '#7f1d1d' },
  HIGH: { bg: '#fee2e2', color: '#991b1b' },
  MEDIUM: { bg: '#fef3c7', color: '#92400e' },
  LOW: { bg: '#f3f4f6', color: '#4b5563' },
}

const PRIORITY_LABEL = { CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }
const CAN_MANAGE = [ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]

export default function BacklogPage() {
  const { projectId = 'p1' } = useParams()
  const navigate = useNavigate()
  const { user, role } = useAuth()
  
  const [items, setItems] = useState([])
  const [sprints, setSprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [endpointMissing, setEndpointMissing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', storyPoints: 3, priority: 'MEDIUM', labels: '' })
  const [assigningId, setAssigningId] = useState(null)

  useEffect(() => {
    if (projectId && isNaN(Number(projectId))) {
      projectApi.listProjects(user?.orgId)
        .then((res) => {
          const firstProj = res.data?.[0]
          if (firstProj?.id) {
            navigate(window.location.pathname.replace(projectId, firstProj.id), { replace: true })
          } else {
            navigate('/projects', { replace: true })
          }
        })
        .catch(() => {
          navigate('/projects', { replace: true })
        })
    }
  }, [projectId, user?.orgId, navigate])

  // AI Copilot state
  const [showAiCopilot, setShowAiCopilot] = useState(false)
  const [aiTab, setAiTab] = useState('task')
  const [aiForm, setAiForm] = useState({ title: '', description: '' })
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const load = useCallback(async () => {
    if (!projectId || isNaN(Number(projectId))) return
    setLoading(true)
    setError('')
    setEndpointMissing(false)
    try {
      const [backlogRes, sprintsRes] = await Promise.all([
        api.get(`/tasks/project/${projectId}/backlog`),
        sprintApi.listProjectSprints(projectId).catch(() => ({ data: [] })),
      ])
      if (!Array.isArray(backlogRes.data)) throw new Error('Unexpected response shape')
      setItems(backlogRes.data)
      setSprints(Array.isArray(sprintsRes.data) ? sprintsRes.data : [])
    } catch (err) {
      if (err?.response?.status === 404) {
        setEndpointMissing(true)
      } else {
        setError(extractErrorMessage(err))
      }
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = {
      title: form.title.trim(),
      storyPoints: Number(form.storyPoints) || 1,
      priority: form.priority,
      labels: form.labels.split(',').map((l) => l.trim()).filter(Boolean),
      projectId: Number(projectId)
    }
    setError('')
    try {
      const res = await taskApi.createTask(payload)
      setItems((prev) => [res.data, ...prev])
      setForm({ title: '', storyPoints: 3, priority: 'MEDIUM', labels: '' })
      setShowForm(false)
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  async function handleAssignSprint(taskId, sprintId) {
    if (!sprintId) return
    setAssigningId(taskId)
    setError('')
    try {
      await taskApi.assignTaskToSprint(taskId, sprintId)
      setItems((prev) => prev.filter((t) => t.id !== taskId))
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setAssigningId(null)
    }
  }

  const runAiTaskTool = async (toolName) => {
    if (!aiForm.title.trim()) {
      setAiError('Please enter a task title first.')
      return
    }
    setAiLoading(true)
    setAiError('')
    setAiResult('')
    try {
      let res
      if (toolName === 'estimate') {
        res = await aiApi.estimateStoryPoints(aiForm.title, aiForm.description)
      } else if (toolName === 'priority') {
        res = await aiApi.recommendPriority(aiForm.title, aiForm.description)
      } else if (toolName === 'breakdown') {
        res = await aiApi.generateTaskBreakdown(aiForm.title, aiForm.description)
      } else if (toolName === 'criteria') {
        res = await aiApi.generateAcceptanceCriteria(aiForm.title, aiForm.description)
      } else if (toolName === 'enhance') {
        res = await aiApi.enhanceTaskDescription(aiForm.title, aiForm.description)
      }
      
      let resStr = ''
      if (res && res.data) {
        if (res.data.response) {
          resStr = res.data.response
        } else if (res.data.enhancedDescription) {
          resStr = `Enhanced Description:\n${res.data.enhancedDescription}\n\nRequirements:\n${(res.data.requirements || []).join('\n')}\n\nAcceptance Criteria:\n${(res.data.acceptanceCriteria || []).join('\n')}`
        } else {
          resStr = JSON.stringify(res.data)
        }
      }
      setAiResult(resStr || 'No response from AI.')
    } catch (err) {
      setAiError(extractErrorMessage(err))
    } finally {
      setAiLoading(false)
    }
  }

  const runAiProjectRisk = async () => {
    if (items.length === 0) {
      setAiError('No backlog items found to analyze.')
      return
    }
    setAiLoading(true)
    setAiError('')
    setAiResult('')
    try {
      const taskTitles = items.map(t => t.title)
      const res = await aiApi.analyzeProjectRisk(projectId, taskTitles)
      setAiResult(res.data.response || JSON.stringify(res.data))
    } catch (err) {
      setAiError(extractErrorMessage(err))
    } finally {
      setAiLoading(false)
    }
  }

  const totalPoints = items.reduce((sum, i) => sum + (i.storyPoints || 0), 0)

  return (
    <div className="wk-page">
      <div className="ag-tabs">
        <Link to={`/projects/${projectId}/backlog`} className="ag-tab ag-tab-active">Backlog</Link>
        <Link to={`/projects/${projectId}/board`} className="ag-tab">Board</Link>
      </div>

      <div className="wk-page-header" style={{ justifyContent: 'space-between' }}>
        <p className="wk-page-subtitle">{items.length} items · {totalPoints} points total</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="wk-btn wk-btn-secondary" style={{ width: 'auto' }} onClick={() => setShowAiCopilot(s => !s)}>
            {showAiCopilot ? 'Hide AI Copilot' : '🤖 AI Copilot'}
          </button>
          <Can roles={CAN_MANAGE}>
            <button className="wk-btn wk-btn-primary" style={{ width: 'auto' }} onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Cancel' : '+ Add item'}
            </button>
          </Can>
        </div>
      </div>

      {endpointMissing && (
        <p className="wk-alert wk-alert-info">
          Your backend doesn't have a "list tasks by project" endpoint yet
          (tried <code>GET /api/tasks/project/{'{projectId}'}/backlog</code>, got 404).
          Ask your backend developer to add one — until then this list stays empty,
          though adding new items still works via the real <code>POST /api/tasks</code> endpoint.
        </p>
      )}

      {error && !endpointMissing && (
        <p className="wk-alert wk-alert-error">
          Could not load the backlog. ({error})
        </p>
      )}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 500px' }}>
          {showForm && (
            <form className="wk-card ag-add-form" onSubmit={handleAdd} style={{ marginBottom: 20 }}>
              <div className="wk-field">
                <label className="wk-label">Title</label>
                <input
                  className="wk-input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Slot availability calendar view"
                />
              </div>
              <div className="wk-row-2">
                <div className="wk-field">
                  <label className="wk-label">Story points (1–13)</label>
                  <input
                    type="number"
                    min="1"
                    max="13"
                    className="wk-input"
                    value={form.storyPoints}
                    onChange={(e) => setForm((f) => ({ ...f, storyPoints: e.target.value }))}
                  />
                </div>
                <div className="wk-field">
                  <label className="wk-label">Priority</label>
                  <select className="wk-select" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
              <div className="wk-field">
                <label className="wk-label">Labels (comma separated)</label>
                <input
                  className="wk-input"
                  value={form.labels}
                  onChange={(e) => setForm((f) => ({ ...f, labels: e.target.value }))}
                  placeholder="frontend, payments"
                />
              </div>
              <button className="wk-btn wk-btn-primary" type="submit">Add to backlog</button>
            </form>
          )}

          <div className="wk-card" style={{ padding: 0 }}>
            {loading ? (
              <p className="wk-empty">Loading backlog…</p>
            ) : items.length === 0 ? (
              <p className="wk-empty">Backlog is empty.</p>
            ) : (
              <div className="ag-backlog-list">
                {items.map((item) => {
                  const pStyle = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.MEDIUM
                  return (
                    <div key={item.id} className="ag-backlog-row">
                      <span className="ag-points-chip">{item.storyPoints}</span>
                      <div className="ag-backlog-main">
                        <span className="ag-backlog-title">{item.title}</span>
                        {item.assigneeName && <span className="ag-backlog-spec">Assignee: {item.assigneeName}</span>}
                        {item.specTitle && !item.assigneeName && <span className="ag-backlog-spec">Traces to: {item.specTitle}</span>}
                      </div>
                      <div className="ag-backlog-labels">
                        {(item.labels || []).map((l) => (
                          <span key={l} className="ag-label-chip">{l}</span>
                        ))}
                      </div>
                      <span className="ag-priority-chip" style={{ background: pStyle.bg, color: pStyle.color }}>
                        {PRIORITY_LABEL[item.priority] || item.priority}
                      </span>
                      <Can roles={CAN_MANAGE}>
                        <select
                          className="wk-select"
                          style={{ fontSize: 12, padding: '5px 26px 5px 8px' }}
                          value=""
                          disabled={assigningId === item.id || sprints.length === 0}
                          onChange={(e) => handleAssignSprint(item.id, e.target.value)}
                        >
                          <option value="" disabled>
                            {sprints.length === 0 ? 'No sprints yet' : 'Add to sprint…'}
                          </option>
                          {sprints.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </Can>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {showAiCopilot && (
          <div className="wk-card" style={{ flex: '0 0 380px', position: 'sticky', top: 20, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🤖</span> NeuroForge AI Copilot
            </h3>
            
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f1f5f9', padding: 4, borderRadius: 8 }}>
              <button 
                type="button"
                onClick={() => setAiTab('task')} 
                style={{ 
                  flex: 1, 
                  padding: '6px 12px', 
                  border: 'none', 
                  borderRadius: 6, 
                  background: aiTab === 'task' ? '#fff' : 'transparent', 
                  fontWeight: aiTab === 'task' ? 600 : 500, 
                  cursor: 'pointer',
                  boxShadow: aiTab === 'task' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Task Assist
              </button>
              <button 
                type="button"
                onClick={() => setAiTab('project')} 
                style={{ 
                  flex: 1, 
                  padding: '6px 12px', 
                  border: 'none', 
                  borderRadius: 6, 
                  background: aiTab === 'project' ? '#fff' : 'transparent', 
                  fontWeight: aiTab === 'project' ? 600 : 500, 
                  cursor: 'pointer',
                  boxShadow: aiTab === 'project' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Project Risks
              </button>
            </div>

            {aiError && <p className="wk-alert wk-alert-error" style={{ fontSize: 12.5, margin: '0 0 12px 0', padding: '8px 12px' }}>{aiError}</p>}

            {aiTab === 'task' ? (
              <div>
                <div className="wk-field" style={{ marginBottom: 12 }}>
                  <label className="wk-label" style={{ fontSize: 12 }}>Task Title</label>
                  <input 
                    className="wk-input" 
                    value={aiForm.title} 
                    onChange={e => setAiForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Integrate Stripe payment gateway" 
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div className="wk-field" style={{ marginBottom: 16 }}>
                  <label className="wk-label" style={{ fontSize: 12 }}>Description (optional)</label>
                  <textarea 
                    className="wk-textarea" 
                    rows={3}
                    value={aiForm.description} 
                    onChange={e => setAiForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Provide details for better recommendations…" 
                    style={{ fontSize: 13, width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  <button type="button" className="wk-btn" style={{ fontSize: 12, padding: '8px 10px', background: '#e2e8f0', color: '#1e293b' }} onClick={() => runAiTaskTool('estimate')} disabled={aiLoading}>
                    Estimate Points
                  </button>
                  <button type="button" className="wk-btn" style={{ fontSize: 12, padding: '8px 10px', background: '#e2e8f0', color: '#1e293b' }} onClick={() => runAiTaskTool('priority')} disabled={aiLoading}>
                    Recommend Priority
                  </button>
                  <button type="button" className="wk-btn" style={{ fontSize: 12, padding: '8px 10px', background: '#e2e8f0', color: '#1e293b' }} onClick={() => runAiTaskTool('breakdown')} disabled={aiLoading}>
                    Break Down
                  </button>
                  <button type="button" className="wk-btn" style={{ fontSize: 12, padding: '8px 10px', background: '#e2e8f0', color: '#1e293b' }} onClick={() => runAiTaskTool('criteria')} disabled={aiLoading}>
                    Gen Criteria
                  </button>
                  <button type="button" className="wk-btn" style={{ gridColumn: 'span 2', fontSize: 12, padding: '8px 10px', background: '#e2e8f0', color: '#1e293b' }} onClick={() => runAiTaskTool('enhance')} disabled={aiLoading}>
                    Enhance Task Description
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Analyze all current tasks in the backlog to identify delivery risks, dependency bottlenecks, and testing challenges.
                </p>
                <button type="button" className="wk-btn wk-btn-primary" onClick={runAiProjectRisk} disabled={aiLoading}>
                  {aiLoading ? 'Analyzing…' : 'Run Backlog Risk Analysis'}
                </button>
              </div>
            )}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
              <label className="wk-label" style={{ fontSize: 12, color: '#64748b' }}>AI Response</label>
              <div style={{ 
                background: '#f8fafc', 
                border: '1px solid #cbd5e1', 
                borderRadius: 8, 
                padding: 12, 
                minHeight: 120, 
                maxHeight: 250, 
                overflowY: 'auto',
                fontSize: 13,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                color: '#0f172a',
                lineHeight: 1.5
              }}>
                {aiLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
                    <div style={{ height: 12, background: '#e2e8f0', borderRadius: 4 }} />
                    <div style={{ height: 12, background: '#e2e8f0', borderRadius: 4, width: '80%' }} />
                    <div style={{ height: 12, background: '#e2e8f0', borderRadius: 4, width: '60%' }} />
                  </div>
                ) : aiResult ? aiResult : 'Run a tool to see AI insights here.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}