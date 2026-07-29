import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { sprintApi } from '../api/sprintApi.js'
import { taskApi } from '../api/taskApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'
import BurndownChart from '../components/BurndownChart.jsx'
import './agile.css'

const COLUMNS = ['To Do', 'In Progress', 'Code Review', 'Testing', 'Done']

const PRIORITY_DOT = { High: '#dc2626', Medium: '#d97706', Low: '#9ca3af' }


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
  const { projectId = 'p1', sprintId = 'current' } = useParams()
  const { role } = useAuth()
  const [tasks, setTasks] = useState([])
  const [burndown, setBurndown] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [burndownError, setBurndownError] = useState('')
  const [blockedNote, setBlockedNote] = useState('')
  const [dragTaskId, setDragTaskId] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await sprintApi.getBoard(sprintId)
      setTasks(normalizeBoardResponse(res.data))
    } catch (err) {
      setError(extractErrorMessage(err))
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [sprintId])

  const loadBurndown = useCallback(async () => {
    setBurndownError('')
    try {
      const res = await sprintApi.getBurndown(sprintId)
      if (!Array.isArray(res.data)) throw new Error('Unexpected response shape')
      setBurndown(res.data)
    } catch (err) {
      setBurndownError(extractErrorMessage(err))
      setBurndown([])
    }
  }, [sprintId])

  useEffect(() => {
    load()
    loadBurndown()
  }, [load, loadBurndown])

  function canMoveTo(targetStatus) {
    if (targetStatus === 'Done') {
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
      setTimeout(() => setBlockedNote(''), 2500)
      return
    }

    const taskId = dragTaskId
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)))
    setDragTaskId(null)

    taskApi.updateStatus(taskId, targetStatus).catch(() => {
    })
  }

  const tasksByColumn = COLUMNS.reduce((acc, col) => {
    acc[col] = tasks.filter((t) => t.status === col)
    return acc
  }, {})

  return (
    <div className="wk-page" style={{ maxWidth: 1200 }}>
      <div className="ag-tabs">
        <Link to={`/projects/${projectId}/backlog`} className="ag-tab">Backlog</Link>
        <Link to={`/projects/${projectId}/board`} className="ag-tab ag-tab-active">Board</Link>
      </div>

      {error && (
        <p className="wk-alert wk-alert-error">
          Could not load tasks. ({error})
        </p>
      )}
      {blockedNote && <p className="wk-alert wk-alert-error">{blockedNote}</p>}

      <div className="wk-card">
        <h3 className="ag-burndown-title">Sprint burndown</h3>
        {burndownError ? (
          <p className="wk-empty">Burndown data unavailable. ({burndownError})</p>
        ) : burndown.length === 0 ? (
          <p className="wk-empty">No burndown data yet for this sprint.</p>
        ) : (
          <BurndownChart data={burndown} />
        )}
      </div>

      {loading ? (
        <p className="wk-empty">Loading board…</p>
      ) : (
        <div className="ag-board">
          {COLUMNS.map((col) => (
            <div
              key={col}
              className={`ag-column ${dragOverCol === col ? 'ag-column-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col) }}
              onDragLeave={() => setDragOverCol((c) => (c === col ? null : c))}
              onDrop={(e) => { e.preventDefault(); handleDrop(col) }}
            >
              <div className="ag-column-header">
                <span>{col}</span>
                <span className="ag-column-count">{tasksByColumn[col].length}</span>
              </div>

              <div className="ag-column-body">
                {tasksByColumn[col].map((task) => (
                  <div
                    key={task.id}
                    className="ag-card"
                    draggable
                    onDragStart={() => setDragTaskId(task.id)}
                    onDragEnd={() => setDragTaskId(null)}
                  >
                    <p className="ag-card-title">{task.title}</p>
                    <div className="ag-card-footer">
                      <span className="ag-card-points">{task.points} pts</span>
                      <span className="ag-priority-dot" style={{ background: PRIORITY_DOT[task.priority] || '#9ca3af' }} />
                      {task.assignee && <Avatar name={task.assignee} size={22} />}
                    </div>
                  </div>
                ))}
                {tasksByColumn[col].length === 0 && (
                  <p className="ag-column-empty">Drop tasks here</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}