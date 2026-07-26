import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { taskApi } from '../api/taskApi.js'
import { api, extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Can from '../components/Can.jsx'
import './agile.css'

const PRIORITY_STYLE = {
  High: { bg: '#fee2e2', color: '#991b1b' },
  Medium: { bg: '#fef3c7', color: '#92400e' },
  Low: { bg: '#f3f4f6', color: '#4b5563' },
}

const CAN_MANAGE = [ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]


export default function BacklogPage() {
  const { projectId = 'p1' } = useParams()
  const { role } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [endpointMissing, setEndpointMissing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', points: 3, priority: 'Medium', labels: '' })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setEndpointMissing(false)
    try {
      const res = await api.get(`/projects/${projectId}/tasks`)
      if (!Array.isArray(res.data)) throw new Error('Unexpected response shape')
      setItems(res.data)
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
      points: Number(form.points) || 0,
      priority: form.priority,
      labels: form.labels.split(',').map((l) => l.trim()).filter(Boolean),
      projectId,
      sprintId: null, 
    }
    try {
      const res = await taskApi.createTask(payload)
      setItems((prev) => [res.data, ...prev])
    } catch (err) {
      setError(extractErrorMessage(err))
      return
    }
    setForm({ title: '', points: 3, priority: 'Medium', labels: '' })
    setShowForm(false)
  }

  const totalPoints = items.reduce((sum, i) => sum + (i.points || 0), 0)

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

      {endpointMissing && (
        <p className="wk-alert wk-alert-info">
          Your backend doesn't have a "list tasks by project" endpoint yet
          (tried <code>GET /api/projects/{'{projectId}'}/tasks</code>, got 404).
          Ask your backend developer to add one — until then this list stays empty,
          though adding new items still works via the real <code>POST /api/tasks</code> endpoint.
        </p>
      )}

      {error && !endpointMissing && (
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
              <label className="wk-label">Story points</label>
              <input
                type="number"
                min="1"
                className="wk-input"
                value={form.points}
                onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
              />
            </div>
            <div className="wk-field">
              <label className="wk-label">Priority</label>
              <select className="wk-select" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
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
              const pStyle = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.Medium
              return (
                <div key={item.id} className="ag-backlog-row">
                  <span className="ag-points-chip">{item.points}</span>
                  <div className="ag-backlog-main">
                    <span className="ag-backlog-title">{item.title}</span>
                    {item.specTitle && <span className="ag-backlog-spec">Traces to: {item.specTitle}</span>}
                  </div>
                  <div className="ag-backlog-labels">
                    {(item.labels || []).map((l) => (
                      <span key={l} className="ag-label-chip">{l}</span>
                    ))}
                  </div>
                  <span className="ag-priority-chip" style={{ background: pStyle.bg, color: pStyle.color }}>
                    {item.priority}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}