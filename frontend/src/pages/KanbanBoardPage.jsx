import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { taskApi } from '../api/taskApi.js'
import { sprintApi } from '../api/sprintApi.js'
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

export default function KanbanBoardPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()

  const [sprints, setSprints] = useState([])
  const [selectedSprintId, setSelectedSprintId] = useState(null)
  const [board, setBoard] = useState(null) // raw BoardResponse from backend
  const [burndown, setBurndown] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [burndownError, setBurndownError] = useState('')
  const [blockedNote, setBlockedNote] = useState('')
  const [dragTaskId, setDragTaskId] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

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
      setBoard(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
      setBoard(null)
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

  function canMoveTo(targetStatus) {
    if (targetStatus === 'DONE') {
      return [ROLES.QA_TESTER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN].includes(role)
    }
    return true
  }

  function handleDrop(targetStatus) {
    setDragOverCol(null)
    if (!dragTaskId) return

    if (!canMoveTo(targetStatus)) {
      setBlockedNote('Only QA can move a task to Done (frontend rule — not enforced by the backend).')
      setDragTaskId(null)
      setTimeout(() => setBlockedNote(''), 3000)
      return
    }

    const taskId = dragTaskId
    setDragTaskId(null)

    setBoard((prev) => {
      if (!prev) return prev
      const next = { ...prev }
      let movedTask = null
      for (const col of STATUS_COLUMNS) {
        const idx = next[col.key].findIndex((t) => t.id === taskId)
        if (idx !== -1) {
          movedTask = { ...next[col.key][idx], status: targetStatus }
          next[col.key] = next[col.key].filter((t) => t.id !== taskId)
          break
        }
      }
      if (movedTask) {
        const targetCol = STATUS_COLUMNS.find((c) => c.status === targetStatus)
        next[targetCol.key] = [movedTask, ...next[targetCol.key]]
      }
      return next
    })

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

      <div className="wk-card">
        <h3 className="ag-burndown-title">Sprint burndown</h3>
        {burndownError ? (
          <p className="wk-empty">Burndown data unavailable. ({burndownError})</p>
        ) : burndown.length === 0 ? (
          <p className="wk-empty">
            No snapshots captured yet for this sprint. Capture one to start tracking burndown.
          </p>
        ) : (
          <BurndownChart data={burndown} />
        )}
      </div>

      {loading || !board ? (
        <p className="wk-empty">Loading board…</p>
      ) : (
        <div className="ag-board">
          {STATUS_COLUMNS.map((col) => {
            const tasks = board[col.key] || []
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
                  <span className="ag-column-count">{tasks.length}</span>
                </div>

                <div className="ag-column-body">
                  {tasks.map((task) => (
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
                        {task.assigneeName && <Avatar name={task.assigneeName} size={22} />}
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="ag-column-empty">Drop tasks here</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}