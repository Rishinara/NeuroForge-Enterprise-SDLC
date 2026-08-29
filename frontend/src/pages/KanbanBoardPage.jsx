import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { sprintApi } from '../api/sprintApi.js'
import { taskApi } from '../api/taskApi.js'
import { aiApi } from '../api/aiApi.js'
import { projectApi } from '../api/projectApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'
import BurndownChart from '../components/BurndownChart.jsx'

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';

const COLUMNS = ['To Do', 'In Progress', 'Code Review', 'Testing', 'Done']

const PRIORITY_DOT = {
  HIGH: '#dc2626',
  High: '#dc2626',
  MEDIUM: '#d97706',
  Medium: '#d97706',
  LOW: '#9ca3af',
  Low: '#9ca3af',
  CRITICAL: '#991b1b',
}

const STATUS_ENUM_TO_UI = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  CODE_REVIEW: 'Code Review',
  TESTING: 'Testing',
  DONE: 'Done',
  'To Do': 'To Do',
  'In Progress': 'In Progress',
  'Code Review': 'Code Review',
  'Testing': 'Testing',
  'Done': 'Done',
}

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
  let list = []
  if (Array.isArray(data)) {
    list = data
  } else if (data && typeof data === 'object') {
    list = Object.entries(data).flatMap(([status, tasks]) =>
      Array.isArray(tasks) ? tasks.map((t) => ({ ...t, status: t.status || status })) : []
    )
  }
  return list.map((t) => ({ ...t, status: STATUS_ENUM_TO_UI[t.status] || t.status }))
}

export default function KanbanBoardPage() {
  const { projectId = 'p1', sprintId = 'current' } = useParams()
  const { user, role } = useAuth()
  const navigate = useNavigate()
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

  const [activeSprintId, setActiveSprintId] = useState(null)

  useEffect(() => {
    if (projectId && isNaN(Number(projectId))) {
      projectApi.listProjects(user?.orgId)
        .then((res) => {
          const firstProj = res.data?.[0]
          if (firstProj?.id) {
            navigate(`/projects/${firstProj.id}/board`, { replace: true })
          } else {
            navigate('/projects', { replace: true })
          }
        })
        .catch(() => {
          navigate('/projects', { replace: true })
        })
      return
    }

    if (sprintId === 'current') {
      sprintApi.listProjectSprints(projectId)
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const active = res.data.find(s => s.status === 'ACTIVE')
            const planned = res.data.find(s => s.status === 'PLANNED')
            const resolved = active || planned || res.data[0]
            if (resolved?.id) {
              navigate(`/projects/${projectId}/sprints/${resolved.id}/board`, { replace: true })
              return
            }
          }
          setLoading(false)
          setError('No sprints found for this project. Please create a sprint in the Backlog first.')
        })
        .catch((err) => {
          setLoading(false)
          setError(extractErrorMessage(err))
        })
    }
  }, [projectId, sprintId, user?.orgId, navigate])

  const load = useCallback(async () => {
    if (!projectId || isNaN(Number(projectId)) || !sprintId || sprintId === 'current') return
    setLoading(true)
    setError('')
    try {
      const numericProjId = Number(projectId) || null
      const res = await sprintApi.getBoard(sprintId, numericProjId)
      setTasks(normalizeBoardResponse(res.data))
      if (res.data && res.data.sprintId) {
        setActiveSprintId(res.data.sprintId)
      }
    } catch (err) {
      setError(extractErrorMessage(err))
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [sprintId, projectId])

  const loadBurndown = useCallback(async () => {
    if (!projectId || isNaN(Number(projectId)) || !sprintId || sprintId === 'current') return
    setBurndownError('')
    try {
      const numericProjId = Number(projectId) || null
      const res = await sprintApi.getBurndown(sprintId, numericProjId)
      if (!Array.isArray(res.data)) throw new Error('Unexpected response shape')
      setBurndown(res.data)
    } catch (err) {
      setBurndownError(extractErrorMessage(err))
      setBurndown([])
    }
  }, [sprintId, projectId])

  useEffect(() => {
    load()
    loadBurndown()
  }, [load, loadBurndown])

  useEffect(() => {
    if (!activeSprintId) return

    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api'
    const wsUrl = apiUrl.replace('http', 'ws').replace('/api', '/ws/websocket')

    const client = new SimpleStompClient(wsUrl, (event) => {
      if (event && event.taskId && event.newStatus) {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === Number(event.taskId)) {
              return { ...t, status: STATUS_ENUM_TO_UI[event.newStatus] || event.newStatus }
            }
            return t
          })
        )
      }
    })

    client.connect()
    client.subscribe(`/topic/sprints/${activeSprintId}`)

    return () => {
      client.disconnect()
    }
  }, [activeSprintId])

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
      const sprintName = tasks[0]?.sprintName || `Sprint ${sprintId}`
      const res = await aiApi.analyzeSprint(sprintName, taskTitles)
      setAiResult(res.data.response || JSON.stringify(res.data))
    } catch (err) {
      setAiError(extractErrorMessage(err))
    } finally {
      setAiLoading(false)
    }
  }

  function canMoveTo(targetStatus, previousStatus) {
    if (role === ROLES.CLIENT) return false
    const isDev = [ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER].includes(role);
    if (isDev) {
      // Developer can move from "To Do" to "In Progress" and "In Progress" to "Code Review"
      if (previousStatus === 'To Do' && targetStatus === 'In Progress') {
        return true
      }
      if (previousStatus === 'In Progress' && targetStatus === 'Code Review') {
        return true
      }
      return false
    }
    if (role === ROLES.QA_TESTER) {
      if (previousStatus === 'Code Review' && targetStatus === 'Testing') {
        return true
      }
      if (previousStatus === 'Testing' && targetStatus === 'Done') {
        return true
      }
      return false
    }
    if (targetStatus === 'Done') {
      return [ROLES.QA_TESTER, ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.PROJECT_MANAGER].includes(role)
    }
    return true
  }

  async function handleDrop(targetStatus) {
    setDragOverCol(null)
    if (!dragTaskId) return

    const taskId = dragTaskId
    const taskToMove = tasks.find(t => t.id === taskId)
    const previousStatus = taskToMove ? taskToMove.status : null

    if (!canMoveTo(targetStatus, previousStatus)) {
      const isDev = [ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER].includes(role);
      if (isDev) {
        setBlockedNote('Developers can only move tasks from To Do to In Progress, or In Progress to Code Review.')
      } else if (role === ROLES.QA_TESTER) {
        setBlockedNote('QA Testers can only move tasks from Code Review to Testing, or Testing to Done.')
      } else {
        setBlockedNote('You do not have permission to move the task here.')
      }
      setDragTaskId(null)
      setTimeout(() => setBlockedNote(''), 2500)
      return
    }

    // Previous consts were declared earlier in this function

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)))
    setDragTaskId(null)

    try {
      await taskApi.updateStatus(taskId, targetStatus)
      // The websocket will also broadcast the update to all clients
    } catch (err) {
      // Rollback on failure
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t)))
      setBlockedNote(extractErrorMessage(err) || 'Failed to update task status.')
      setTimeout(() => setBlockedNote(''), 3500)
    }
  }

  const tasksByColumn = COLUMNS.reduce((acc, col) => {
    acc[col] = tasks.filter((t) => t.status === col)
    return acc
  }, {})

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sprint Board</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track your active sprint</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <Link to={`/projects/${projectId}/backlog`} className="px-4 py-2 text-sm font-medium text-slate-600 rounded-md hover:text-slate-900">Backlog</Link>
          <Link to={`/projects/${projectId}/board`} className="px-4 py-2 text-sm font-medium text-orange-600 bg-white rounded-md shadow-sm">Board</Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
          Could not load tasks. ({error})
        </div>
      )}
      {blockedNote && (
        <div className="mb-6 p-4 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 text-sm">
          {blockedNote}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 mb-8 items-stretch">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex-1 flex flex-col min-h-[300px]">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Sprint burndown</h3>
          {burndownError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
              <div className="w-10 h-10 text-slate-300 mb-3 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <p className="text-sm font-medium text-slate-600">Burndown unavailable</p>
              <p className="text-xs text-slate-400 mt-1">{burndownError}</p>
            </div>
          ) : burndown.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
              <div className="w-10 h-10 text-slate-300 mb-3 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
              </div>
              <p className="text-sm font-medium text-slate-600">No burndown data yet</p>
              <p className="text-xs text-slate-400 mt-1">Tasks need to be moved to track progress.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-[200px]">
              <BurndownChart data={burndown} />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 lg:w-96 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <span className="text-2xl">🤖</span> AI Sprint Coach
            </h3>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${aiLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
              onClick={runSprintAnalysis}
              disabled={aiLoading}
            >
              {aiLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
          {aiError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-xs">
              {aiError}
            </div>
          )}
          <div className="bg-slate-50 rounded-lg border border-slate-100 p-5 flex-1 overflow-y-auto min-h-[160px] text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {aiLoading ? (
              <div className="animate-pulse flex flex-col gap-3">
                <div className="h-2.5 bg-slate-200 rounded-full w-full" />
                <div className="h-2.5 bg-slate-200 rounded-full w-5/6" />
                <div className="h-2.5 bg-slate-200 rounded-full w-4/6" />
              </div>
            ) : aiResult ? (
              aiResult
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-slate-400">Click analyze to get Scrum Master feedback.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-sm font-medium text-slate-600">Loading board…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-start min-h-[550px]">
          {COLUMNS.map((col) => (
            <div
              key={col}
              className={`flex flex-col bg-slate-50 border border-slate-200 rounded-2xl transition-all duration-150 min-h-[480px] shadow-xs ${dragOverCol === col ? 'bg-orange-50/70 border-orange-400 ring-4 ring-orange-500/10' : 'hover:border-slate-300'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col) }}
              onDragLeave={() => setDragOverCol((c) => (c === col ? null : c))}
              onDrop={(e) => { e.preventDefault(); handleDrop(col) }}
            >
              <div className="p-4 flex items-center justify-between border-b border-slate-200/80 bg-white/50 rounded-t-2xl">
                <h4 className="text-base font-semibold text-slate-900">{formatEnum(col)}</h4>
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold text-slate-500 bg-slate-200 rounded-full">
                  {tasksByColumn[col].length}
                </span>
              </div>

              <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1 min-h-[150px]">
                {tasksByColumn[col].map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-orange-300 hover:shadow transition-all"
                    draggable={role !== ROLES.CLIENT && ((![ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER].includes(role) && role !== ROLES.QA_TESTER) || task.assigneeId === user?.id)}
                    onDragStart={() => setDragTaskId(task.id)}
                    onDragEnd={() => setDragTaskId(null)}
                  >
                    <p className="text-sm font-medium text-slate-800 mb-4 line-clamp-2">{task.title}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">
                          {task.points != null ? `${task.points} pts` : '- pts'}
                        </span>
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: PRIORITY_DOT[task.priority] || '#9ca3af' }}
                          title={`Priority: ${formatEnum(task.priority)}`}
                        />
                      </div>
                      {task.assignee ? <Avatar name={task.assignee} size={24} /> : <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200"></div>}
                    </div>
                  </div>
                ))}
                {tasksByColumn[col].length === 0 && (
                  <div className="flex flex-col items-center justify-center p-6 bg-transparent rounded-lg border-2 border-dashed border-slate-200 text-center h-full">
                    <p className="text-sm font-medium text-slate-400">Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}