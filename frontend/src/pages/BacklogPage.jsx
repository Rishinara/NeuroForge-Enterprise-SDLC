import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { taskApi } from '../api/taskApi.js'
import { sprintApi } from '../api/sprintApi.js'
import { extractErrorMessage } from '../api/client.js'
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
  const { projectId } = useParams()
  const [items, setItems] = useState([])
  const [sprints, setSprints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', storyPoints: 3, priority: 'MEDIUM', labels: '' })
  const [assigningId, setAssigningId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [backlogRes, sprintsRes] = await Promise.all([
        taskApi.listProjectBacklog(projectId),
        sprintApi.listProjectSprints(projectId).catch(() => ({ data: [] })),
      ])
      if (!Array.isArray(backlogRes.data)) throw new Error('Unexpected response shape')
      setItems(backlogRes.data)
      setSprints(Array.isArray(sprintsRes.data) ? sprintsRes.data : [])
    } catch (err) {
      setError(extractErrorMessage(err))
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
      priority: form.priority,
      storyPoints: Number(form.storyPoints) || 1,
      labels: form.labels.split(',').map((l) => l.trim()).filter(Boolean),
      projectId: Number(projectId),
      // sprintId omitted entirely -> backend creates this as a backlog item
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
      // moved into a sprint -> no longer backlog, remove from this list
      setItems((prev) => prev.filter((t) => t.id !== taskId))
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setAssigningId(null)
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
        <Can roles={CAN_MANAGE}>
          <button className="wk-btn wk-btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : '+ Add item'}
          </button>
        </Can>
      </div>

      {error && (
        <p className="wk-alert wk-alert-error">
          Could not load the backlog. ({error})
        </p>
      )}

      {showForm && (
        <form className="wk-card ag-add-form" onSubmit={handleAdd}>
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
  )
}