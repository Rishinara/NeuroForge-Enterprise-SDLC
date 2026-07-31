import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { taskApi } from '../api/taskApi.js'
import { sprintApi } from '../api/sprintApi.js'
import { aiApi } from '../api/aiApi.js'
import { projectApi } from '../api/projectApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'
import BurndownChart from '../components/BurndownChart.jsx'
import './agile.css'

const STATUS_COLUMNS = [
  { key: 'todo', status: 'TODO', label: 'To Do' },
  { key: 'inProgress', status: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'codeReview', status: 'CODE_REVIEW', label: 'Code Review' },
  { key: 'testing', status: 'TESTING', label: 'Testing' },
  { key: 'done', status: 'DONE', label: 'Done' },
]

const PRIORITY_DOT = { CRITICAL: '#7f1d1d', HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#9ca3af' }

class SimpleStompClient {
  constructor(url, onMessage) {
    this.url = url
    this.onMessage = onMessage
    this.socket = null
    this.subscriptions = []
    this.connected = false
  }

  connect() {
    try {
      this.socket = new WebSocket(this.url)
      
      this.socket.onopen = () => {
        this.socket.send("CONNECT\naccept-version:1.1,1.2\n\n\u0000")
      }

      this.socket.onmessage = (event) => {
        const data = event.data
        if (data.startsWith("CONNECTED")) {
          this.connected = true
          this.subscriptions.forEach(dest => {
            this.socket.send(`SUBSCRIBE\nid:${dest}\ndestination:${dest}\n\n\u0000`)
          })
        } else if (data.startsWith("MESSAGE")) {
          const parts = data.split("\n\n")
          if (parts.length > 1) {
            const body = parts[1].replace("\u0000", "").trim()
            try {
              this.onMessage(JSON.parse(body))
            } catch (e) {
              this.onMessage(body)
            }
          }
        }
      }

      this.socket.onclose = () => {
        this.connected = false
        if (this.socket) {
          this.reconnectTimer = setTimeout(() => this.connect(), 5000)
        }
      }

      this.socket.onerror = (err) => {
        console.warn("WebSocket error: ", err)
      }
    } catch (e) {
      console.warn("WebSocket connection failed: ", e)
    }
  }

  subscribe(destination) {
    if (!this.subscriptions.includes(destination)) {
      this.subscriptions.push(destination)
    }
    if (this.connected && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(`SUBSCRIBE\nid:${destination}\ndestination:${destination}\n\n\u0000`)
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.socket) {
      const sock = this.socket
      this.socket = null
      sock.close()
    }
  }
}

function normalizeBoardResponse(data) {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    return Object.entries(data).flatMap(([status, tasks]) =>
      Array.isArray(tasks) ? tasks.map((t) => ({ ...t, status: t.status || status })) : []
    )
  }
  return []
}

export default function KanbanBoardPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user, role } = useAuth()

  const [sprints, setSprints] = useState([])
  const [selectedSprintId, setSelectedSprintId] = useState(null)
  
  const [tasks, setTasks] = useState([])
  const [burndown, setBurndown] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [burndownError, setBurndownError] = useState('')
  const [blockedNote, setBlockedNote] = useState('')
  const [dragTaskId, setDragTaskId] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  // AI Sprint Coach state
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const loadSprints = useCallback(async () => {
    setError('')
    try {
      const res = await sprintApi.listProjectSprints(projectId)
      const list = Array.isArray(res.data) ? res.data : []
      setSprints(list)
      if (list.length > 0) {
        const active = list.find((s) => s.status === 'ACTIVE')
        setSelectedSprintId((active || list[0]).id)
      } else {
        setSelectedSprintId(null)
        setLoading(false)
      }
    } catch (err) {
      setError(extractErrorMessage(err))
      setSprints([])
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadSprints()
  }, [loadSprints])

  const loadBoard = useCallback(async () => {
    if (!selectedSprintId) return
    setLoading(true)
    setError('')
    try {
      const res = await taskApi.getBoard(selectedSprintId)
      setTasks(normalizeBoardResponse(res.data))
    } catch (err) {
      setError(extractErrorMessage(err))
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [selectedSprintId])

  const loadBurndown = useCallback(async () => {
    if (!selectedSprintId) return
    setBurndownError('')
    try {
      const res = await sprintApi.getBurndown(selectedSprintId)
      const snapshots = res.data?.snapshots || []
      const firstTotal = snapshots[0]?.totalStoryPoints ?? 0
      const chartData = snapshots.map((snap, i) => ({
        day: snap.snapshotDate,
        remaining: snap.remainingStoryPoints,
        ideal:
          snapshots.length > 1
            ? Math.round((firstTotal - (firstTotal * i) / (snapshots.length - 1)) * 10) / 10
            : snap.remainingStoryPoints,
      }))
      setBurndown(chartData)
    } catch (err) {
      setBurndownError(extractErrorMessage(err))
      setBurndown([])
    }
  }, [selectedSprintId])

  useEffect(() => {
    loadBoard()
    loadBurndown()
  }, [loadBoard, loadBurndown])

  useEffect(() => {
    if (!selectedSprintId) return

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'
    const wsUrl = apiUrl.replace('http', 'ws').replace('/api', '/ws/websocket')
    
    const client = new SimpleStompClient(wsUrl, (event) => {
      if (event && event.taskId && event.newStatus) {
        setTasks((prev) =>
          prev.map((t) => (t.id === Number(event.taskId) ? { ...t, status: event.newStatus } : t))
        )
      }
    })

    client.connect()
    client.subscribe(`/topic/sprints/${selectedSprintId}`)

    return () => {
      client.disconnect()
    }
  }, [selectedSprintId])

  const runSprintAnalysis = async () => {
    if (tasks.length === 0) {
      setAiError('No tasks on the board to analyze.')
      return
    }
    setAiLoading(true)
    setAiError('')
    setAiResult('')
    try {
      const taskTitles = tasks.map(t => t.title)
      const sprintObj = sprints.find(s => s.id === selectedSprintId)
      const sprintName = sprintObj?.name || `Sprint ${selectedSprintId}`
      const res = await aiApi.analyzeSprint(sprintName, taskTitles)
      setAiResult(res.data.response || JSON.stringify(res.data))
    } catch (err) {
      setAiError(extractErrorMessage(err))
    } finally {
      setAiLoading(false)
    }
  }

  function canMoveTo(targetStatus) {
    if (targetStatus === 'DONE' || targetStatus === 'Done') {
      return [ROLES.QA_TESTER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN].includes(role)
    }
    return true
  }

  function handleDrop(targetStatus) {
    setDragOverCol(null)
    if (!dragTaskId) return

    if (!canMoveTo(targetStatus)) {
      setBlockedNote('Only QA can move a task to Done.')
      setDragTaskId(null)
      setTimeout(() => setBlockedNote(''), 3000)
      return
    }

    const taskId = dragTaskId
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)))
    setDragTaskId(null)

    taskApi.updateStatus(taskId, targetStatus).catch((err) => {
      setError(extractErrorMessage(err))
      loadBoard()
    })
  }

  if (!loading && sprints.length === 0) {
    return (
      <div className="wk-page" style={{ maxWidth: 1200 }}>
        <div className="ag-tabs">
          <Link to={`/projects/${projectId}/backlog`} className="ag-tab">Backlog</Link>
          <Link to={`/projects/${projectId}/board`} className="ag-tab ag-tab-active">Board</Link>
        </div>
        <p className="wk-empty">
          This project has no sprints yet. Create one before a board can be shown.
        </p>
      </div>
    )
  }

  const tasksByColumn = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.status] = tasks.filter((t) => t.status === col.status || t.status === col.label)
    return acc
  }, {})

  return (
    <div className="wk-page" style={{ maxWidth: 1200 }}>
      <div className="ag-tabs">
        <Link to={`/projects/${projectId}/backlog`} className="ag-tab">Backlog</Link>
        <Link to={`/projects/${projectId}/board`} className="ag-tab ag-tab-active">Board</Link>
      </div>

      <div className="wk-page-header" style={{ justifyContent: 'space-between' }}>
        <div className="wk-field" style={{ marginBottom: 0, minWidth: 220 }}>
          <label className="wk-label">Sprint</label>
          <select
            className="wk-select"
            value={selectedSprintId || ''}
            onChange={(e) => setSelectedSprintId(Number(e.target.value))}
          >
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="wk-alert wk-alert-error">{error}</p>}
      {blockedNote && <p className="wk-alert wk-alert-error">{blockedNote}</p>}

      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap', alignItems: 'stretch' }}>
        <div className="wk-card" style={{ flex: '1 1 500px', margin: 0 }}>
          <h3 className="ag-burndown-title">Sprint burndown</h3>
          {burndownError ? (
            <p className="wk-empty">Burndown data unavailable. ({burndownError})</p>
          ) : burndown.length === 0 ? (
            <p className="wk-empty">No burndown data yet for this sprint.</p>
          ) : (
            <BurndownChart data={burndown} />
          )}
        </div>
        
        <div className="wk-card" style={{ flex: '0 0 380px', margin: 0, padding: 20, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🤖</span> AI Sprint Coach
          </h3>
          {aiError && <p className="wk-alert wk-alert-error" style={{ fontSize: 12.5, padding: '6px 12px', margin: '0 0 12px 0' }}>{aiError}</p>}
          <button 
            type="button" 
            className="wk-btn wk-btn-primary" 
            style={{ marginBottom: 12, width: 'auto' }} 
            onClick={runSprintAnalysis} 
            disabled={aiLoading}
          >
            {aiLoading ? 'Analyzing...' : 'Analyze Sprint Planning'}
          </button>
          <div style={{ 
            background: '#f8fafc', 
            border: '1px solid #cbd5e1', 
            borderRadius: 8, 
            padding: 12, 
            flex: 1,
            minHeight: 120, 
            maxHeight: 250,
            overflowY: 'auto',
            fontSize: 12.5,
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
            ) : aiResult || 'Click above to get Scrum Master feedback.'}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="wk-empty">Loading board…</p>
      ) : (
        <div className="ag-board">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = tasksByColumn[col.status] || []
            return (
              <div
                key={col.key}
                className={`ag-column ${dragOverCol === col.status ? 'ag-column-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.status) }}
                onDragLeave={() => setDragOverCol((c) => (c === col.status ? null : c))}
                onDrop={(e) => { e.preventDefault(); handleDrop(col.status) }}
              >
                <div className="ag-column-header">
                  <span>{col.label}</span>
                  <span className="ag-column-count">{colTasks.length}</span>
                </div>

                <div className="ag-column-body">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="ag-card"
                      draggable
                      onDragStart={() => setDragTaskId(task.id)}
                      onDragEnd={() => setDragTaskId(null)}
                    >
                      <p className="ag-card-title">{task.title}</p>
                      <div className="ag-card-footer">
                        <span className="ag-card-points">{task.storyPoints} pts</span>
                        <span className="ag-priority-dot" style={{ background: PRIORITY_DOT[task.priority] || '#9ca3af' }} />
                        {(task.assigneeName || task.assignee) && <Avatar name={task.assigneeName || task.assignee} size={22} />}
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && <p className="ag-column-empty">Drop tasks here</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}