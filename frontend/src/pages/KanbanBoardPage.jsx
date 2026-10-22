import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { sprintApi } from '../api/sprintApi.js'
import { taskApi } from '../api/taskApi.js'
import { aiApi } from '../api/aiApi.js'
import { projectApi } from '../api/projectApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import BurndownChart from '../components/BurndownChart.jsx'
import AiResponseFormatter, { extractCleanText } from '../components/AiResponseFormatter.jsx'
import {
  Sparkles,
  Clock,
  CheckCircle2,
  CircleDashed,
  Code2,
  TestTube2,
  Layers,
  Search,
  Filter,
  User,
  AlertCircle,
  ArrowRight,
  TrendingDown,
  Bot,
  X,
  ChevronRight,
  Folder,
  Lock,
  Check,
  Zap,
} from 'lucide-react'

const formatEnum = (val) => (val ? val.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) : 'Unknown')

const COLUMNS = ['To Do', 'In Progress', 'Code Review', 'Testing', 'Done']

const COLUMN_CONFIG = {
  'To Do': {
    label: 'To Do',
    borderTop: 'border-t-slate-400',
    headerBadge: 'bg-slate-100 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
    dragOverStyle: 'bg-slate-100/80 border-slate-400 ring-4 ring-slate-400/10',
    icon: CircleDashed,
    iconColor: 'text-slate-500',
  },
  'In Progress': {
    label: 'In Progress',
    borderTop: 'border-t-amber-500',
    headerBadge: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
    dragOverStyle: 'bg-amber-50/80 border-amber-400 ring-4 ring-amber-500/15',
    icon: Clock,
    iconColor: 'text-amber-500',
  },
  'Code Review': {
    label: 'Code Review',
    borderTop: 'border-t-indigo-500',
    headerBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dotColor: 'bg-indigo-500',
    dragOverStyle: 'bg-indigo-50/80 border-indigo-400 ring-4 ring-indigo-500/15',
    icon: Code2,
    iconColor: 'text-indigo-500',
  },
  'Testing': {
    label: 'Testing',
    borderTop: 'border-t-sky-500',
    headerBadge: 'bg-sky-50 text-sky-700 border-sky-200',
    dotColor: 'bg-sky-500',
    dragOverStyle: 'bg-sky-50/80 border-sky-400 ring-4 ring-sky-500/15',
    icon: TestTube2,
    iconColor: 'text-sky-500',
  },
  'Done': {
    label: 'Done',
    borderTop: 'border-t-emerald-500',
    headerBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
    dragOverStyle: 'bg-emerald-50/80 border-emerald-400 ring-4 ring-emerald-500/15',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
  },
}

const PRIORITY_BADGES = {
  CRITICAL: { label: 'Critical', bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-600' },
  HIGH: { label: 'High', bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-600' },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  LOW: { label: 'Low', bg: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
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
        this.socket.send('CONNECT\naccept-version:1.1,1.2\n\n\u0000')
      }

      this.socket.onmessage = (event) => {
        const data = event.data
        if (data.startsWith('CONNECTED')) {
          this.connected = true
          this.subscriptions.forEach((dest) => {
            this.socket.send(`SUBSCRIBE\nid:${dest}\ndestination:${dest}\n\n\u0000`)
          })
        } else if (data.startsWith('MESSAGE')) {
          const parts = data.split('\n\n')
          if (parts.length > 1) {
            const body = parts[1].replace('\u0000', '').trim()
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
        console.warn('WebSocket error: ', err)
      }
    } catch (e) {
      console.warn('WebSocket connection failed: ', e)
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
  return list.map((t) => ({
    ...t,
    status: STATUS_ENUM_TO_UI[t.status] || t.status,
    points: t.points ?? t.storyPoints ?? 0,
  }))
}

export default function KanbanBoardPage() {
  const { projectId = 'p1', sprintId = 'current' } = useParams()
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const tasksRef = useRef(tasks)
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])
  const [burndown, setBurndown] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [burndownError, setBurndownError] = useState('')
  const [blockedNote, setBlockedNote] = useState('')
  const [dragTaskId, setDragTaskId] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [myTasksOnly, setMyTasksOnly] = useState(false)

  // AI Sprint Coach state
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const [activeSprintId, setActiveSprintId] = useState(null)
  const [sprintName, setSprintName] = useState('')

  const isDev =
    [ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER].includes(role) ||
    ['DEVELOPER', 'FRONTEND_DEVELOPER', 'BACKEND_DEVELOPER'].includes(user?.role)

  // Load project details
  useEffect(() => {
    if (projectId && !isNaN(Number(projectId))) {
      projectApi
        .getProject(Number(projectId))
        .then((res) => setProject(res.data))
        .catch(() => {})
    }
  }, [projectId])

  useEffect(() => {
    if (projectId && isNaN(Number(projectId))) {
      projectApi
        .listProjects(user?.orgId)
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
      sprintApi
        .listProjectSprints(projectId)
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const active = res.data.find((s) => s.status === 'ACTIVE')
            const planned = res.data.find((s) => s.status === 'PLANNED')
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
      const normalized = normalizeBoardResponse(res.data)
      setTasks(normalized)
      if (res.data && res.data.sprintId) {
        setActiveSprintId(res.data.sprintId)
        setSprintName(res.data.sprintName || `Sprint ${res.data.sprintId}`)
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

      const payload = res.data || {}
      const rawSnapshots = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.snapshots)
        ? payload.snapshots
        : []

      const currentTasks = tasksRef.current || []
      const totalPts = payload.totalStoryPoints != null
        ? Number(payload.totalStoryPoints)
        : currentTasks.reduce((sum, t) => sum + (Number(t.points) || Number(t.storyPoints) || 0), 0)

      const donePts = currentTasks
        .filter((t) => t.status === 'Done' || t.status === 'DONE')
        .reduce((sum, t) => sum + (Number(t.points) || Number(t.storyPoints) || 0), 0)

      const remainingPts = Math.max(0, totalPts - donePts)

      if (rawSnapshots.length > 1) {
        const totalDays = Math.max(rawSnapshots.length, 2)
        const mapped = rawSnapshots.map((s, idx) => {
          const dayLabel = s.snapshotDate ? s.snapshotDate.substring(5) : `D${idx + 1}`
          const ideal = Math.max(0, Math.round(totalPts - (idx / (totalDays - 1)) * totalPts))
          return {
            day: dayLabel,
            ideal,
            remaining: s.remainingStoryPoints != null ? Number(s.remainingStoryPoints) : remainingPts
          }
        })
        setBurndown(mapped)
      } else if (rawSnapshots.length === 1) {
        const s = rawSnapshots[0]
        const dayLabel = s.snapshotDate ? s.snapshotDate.substring(5) : 'Day 1'
        setBurndown([
          { day: dayLabel, ideal: totalPts, remaining: s.remainingStoryPoints != null ? Number(s.remainingStoryPoints) : totalPts },
          { day: 'Current', ideal: Math.round(totalPts * 0.5), remaining: remainingPts },
          { day: 'Target', ideal: 0, remaining: 0 }
        ])
      } else {
        setBurndown([
          { day: 'Start', ideal: totalPts, remaining: totalPts },
          { day: 'Current', ideal: Math.round(totalPts * 0.5), remaining: remainingPts },
          { day: 'Target', ideal: 0, remaining: 0 }
        ])
      }
    } catch (err) {
      const currentTasks = tasksRef.current || []
      const totalPts = currentTasks.reduce((sum, t) => sum + (Number(t.points) || Number(t.storyPoints) || 0), 0)
      const donePts = currentTasks
        .filter((t) => t.status === 'Done' || t.status === 'DONE')
        .reduce((sum, t) => sum + (Number(t.points) || Number(t.storyPoints) || 0), 0)
      const remainingPts = Math.max(0, totalPts - donePts)

      setBurndown([
        { day: 'Start', ideal: totalPts, remaining: totalPts },
        { day: 'Current', ideal: Math.round(totalPts * 0.5), remaining: remainingPts },
        { day: 'Target', ideal: 0, remaining: 0 }
      ])
    }
  }, [sprintId, projectId])

  useEffect(() => {
    load()
    loadBurndown()
  }, [sprintId, projectId, load, loadBurndown])

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
      const taskTitles = tasks.map((t) => t.title)
      const sName = sprintName || tasks[0]?.sprintName || `Sprint ${sprintId}`
      const res = await aiApi.analyzeSprint(sName, taskTitles)
      setAiResult(extractCleanText(res?.data) || 'No response from AI.')
    } catch (err) {
      setAiError(extractErrorMessage(err))
    } finally {
      setAiLoading(false)
    }
  }

  function isTaskAssignedToUser(task, currentUser) {
    if (!task || !currentUser) return false
    const currentUserId = currentUser.id || currentUser.userId
    if (task.assigneeId != null && currentUserId != null) {
      if (String(task.assigneeId) === String(currentUserId)) return true
    }
    if (task.assignee && typeof task.assignee === 'object' && task.assignee.id != null && currentUserId != null) {
      if (String(task.assignee.id) === String(currentUserId)) return true
    }
    if (currentUser.email && task.assigneeEmail) {
      if (currentUser.email.toLowerCase() === task.assigneeEmail.toLowerCase()) return true
    }
    if (currentUser.fullName && (task.assigneeName || task.assignee)) {
      const name = task.assigneeName || (typeof task.assignee === 'string' ? task.assignee : task.assignee.fullName)
      if (name && currentUser.fullName.trim().toLowerCase() === name.trim().toLowerCase()) return true
    }
    return false
  }

  function canDragTask(task) {
    if (role === ROLES.CLIENT || user?.role === ROLES.CLIENT) return false
    if (isDev) {
      return isTaskAssignedToUser(task, user)
    }
    return true
  }

  function canMoveTo(targetStatus, previousStatus, taskToMove) {
    if (role === ROLES.CLIENT || user?.role === ROLES.CLIENT) return false
    if (isDev) {
      if (!isTaskAssignedToUser(taskToMove, user)) {
        return false
      }
      if (previousStatus === 'To Do' && targetStatus === 'In Progress') {
        return true
      }
      if (previousStatus === 'In Progress' && targetStatus === 'Code Review') {
        return true
      }
      return false
    }
    if (role === ROLES.QA_TESTER || user?.role === ROLES.QA_TESTER) {
      if (previousStatus === 'Code Review' && targetStatus === 'Testing') {
        return true
      }
      if (previousStatus === 'Testing' && targetStatus === 'Done') {
        return true
      }
      return false
    }
    if (targetStatus === 'Done') {
      return (
        [ROLES.QA_TESTER, ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.PROJECT_MANAGER].includes(role) ||
        ['QA_TESTER', 'SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'].includes(user?.role)
      )
    }
    return true
  }

  async function handleDrop(targetStatus) {
    setDragOverCol(null)
    if (!dragTaskId) return

    const taskId = dragTaskId
    const taskToMove = tasks.find((t) => t.id === taskId)
    const previousStatus = taskToMove ? taskToMove.status : null

    if (isDev && !isTaskAssignedToUser(taskToMove, user)) {
      setBlockedNote('Developers can only move tasks assigned to them.')
      setDragTaskId(null)
      setTimeout(() => setBlockedNote(''), 3000)
      return
    }

    if (!canMoveTo(targetStatus, previousStatus, taskToMove)) {
      if (isDev) {
        if (!isTaskAssignedToUser(taskToMove, user)) {
          setBlockedNote('Developers can only move tasks assigned to them.')
        } else {
          setBlockedNote('Developers can only move tasks from To Do to In Progress, or In Progress to Code Review.')
        }
      } else if (role === ROLES.QA_TESTER || user?.role === ROLES.QA_TESTER) {
        setBlockedNote('QA Testers can only move tasks from Code Review to Testing, or Testing to Done.')
      } else {
        setBlockedNote('You do not have permission to move the task here.')
      }
      setDragTaskId(null)
      setTimeout(() => setBlockedNote(''), 3000)
      return
    }

    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)))
    setDragTaskId(null)

    try {
      await taskApi.updateStatus(taskId, targetStatus)
      loadBurndown()
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t)))
      setBlockedNote(extractErrorMessage(err) || 'Failed to update task status.')
      setTimeout(() => setBlockedNote(''), 3500)
    }
  }

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = (task.title || '').toLowerCase().includes(q)
        const assigneeMatch = (task.assigneeName || task.assignee || '').toLowerCase().includes(q)
        const idMatch = String(task.id).includes(q)
        if (!titleMatch && !assigneeMatch && !idMatch) return false
      }

      if (priorityFilter !== 'ALL') {
        const p = (task.priority || '').toUpperCase()
        if (p !== priorityFilter) return false
      }

      if (myTasksOnly && !isTaskAssignedToUser(task, user)) {
        return false
      }

      return true
    })
  }, [tasks, searchQuery, priorityFilter, myTasksOnly, user])

  const tasksByColumn = useMemo(() => {
    return COLUMNS.reduce((acc, col) => {
      acc[col] = filteredTasks.filter((t) => t.status === col)
      return acc
    }, {})
  }, [filteredTasks])

  // Board progress metrics
  const metrics = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'Done').length
    const totalPoints = tasks.reduce((sum, t) => sum + (t.points || 0), 0)
    const donePoints = tasks.filter((t) => t.status === 'Done').reduce((sum, t) => sum + (t.points || 0), 0)
    const percent = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, totalPoints, donePoints, percent }
  }, [tasks])

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Top Header & Breadcrumbs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            <Link to="/projects" className="hover:text-orange-600 transition-colors flex items-center gap-1">
              <Folder size={13} className="text-orange-500" /> Projects
            </Link>
            <ChevronRight size={12} className="text-slate-400" />
            <Link to={`/projects/${projectId}`} className="hover:text-orange-600 transition-colors truncate max-w-[200px]">
              {project?.name || `Project #${projectId}`}
            </Link>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="text-orange-600 font-bold">Sprint Board</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {sprintName || 'Sprint Board'}
            </h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Active Sprint
            </span>
          </div>

          <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-3">
            <span>
              <strong>{metrics.total}</strong> Tasks ({metrics.done} completed)
            </span>
            <span className="text-slate-300">•</span>
            <span>
              <strong>{metrics.donePoints}</strong> / {metrics.totalPoints} Story Points Delivered
            </span>
          </p>
        </div>

        {/* View Switcher & Action Tabs */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <Link
              to={`/projects/${projectId}/backlog`}
              className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <Layers size={14} />
              <span>Backlog</span>
            </Link>
            <Link
              to={`/projects/${projectId}/board`}
              className="px-4 py-2 text-xs font-bold text-orange-700 bg-white rounded-lg shadow-sm flex items-center gap-1.5 border border-slate-200/50"
            >
              <CheckCircle2 size={14} className="text-orange-600" />
              <span>Board</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Bar Ribbon */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
          <span className="flex items-center gap-1.5">
            <Zap size={14} className="text-orange-500" />
            Sprint Velocity & Completion Progress
          </span>
          <span className="text-orange-600 font-extrabold text-sm">{metrics.percent}% Complete</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 rounded-full transition-all duration-700 shadow-sm"
            style={{ width: `${metrics.percent}%` }}
          />
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>Could not load tasks. ({error})</span>
        </div>
      )}
      {blockedNote && (
        <div className="p-4 bg-orange-50 text-orange-800 rounded-xl border border-orange-300 text-sm flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <AlertCircle size={18} className="text-orange-600 shrink-0" />
          <span className="font-semibold">{blockedNote}</span>
        </div>
      )}

      {/* Sprint Completed Banner */}
      {metrics.totalTasks > 0 && metrics.doneCount === metrics.totalTasks && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between gap-3 text-emerald-900 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={20} />
            </div>
            <div className="text-xs">
              <span className="font-bold text-sm block text-emerald-950">
                Sprint Completed! All {metrics.totalTasks} tasks are Done.
              </span>
              Associated milestone progress has been automatically updated.
            </div>
          </div>
          <Link
            to={`/projects/${projectId}/milestones`}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors shrink-0"
          >
            View Milestones
          </Link>
        </div>
      )}

      {/* Board Controls Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, assignee, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-slate-400 shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 font-medium cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* "My Tasks Only" Button for Developers */}
          {isDev && (
            <button
              type="button"
              onClick={() => setMyTasksOnly((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                myTasksOnly
                  ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <User size={13} />
              <span>My Assigned Tasks</span>
              {myTasksOnly && <Check size={12} />}
            </button>
          )}

          {(searchQuery || priorityFilter !== 'ALL' || myTasksOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setPriorityFilter('ALL')
                setMyTasksOnly(false)
              }}
              className="text-xs text-orange-600 hover:text-orange-700 font-semibold underline underline-offset-2 ml-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-slate-500 self-end sm:self-auto">
          Showing <span className="text-slate-900 font-bold">{filteredTasks.length}</span> of {tasks.length} tasks
        </div>
      </div>

      {/* Main Kanban Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="animate-spin w-9 h-9 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-sm font-semibold text-slate-700">Loading Kanban board…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-start min-h-[580px]">
          {COLUMNS.map((col) => {
            const cfg = COLUMN_CONFIG[col] || COLUMN_CONFIG['To Do']
            const StatusIcon = cfg.icon
            const colTasks = tasksByColumn[col] || []
            const colPoints = colTasks.reduce((sum, t) => sum + (t.points || 0), 0)
            const isDragTarget = dragOverCol === col

            return (
              <div
                key={col}
                className={`flex flex-col bg-slate-50/80 border border-slate-200/90 rounded-2xl transition-all duration-200 min-h-[520px] shadow-xs border-t-4 ${
                  cfg.borderTop
                } ${isDragTarget ? cfg.dragOverStyle : 'hover:border-slate-300'}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverCol(col)
                }}
                onDragLeave={() => setDragOverCol((c) => (c === col ? null : c))}
                onDrop={(e) => {
                  e.preventDefault()
                  handleDrop(col)
                }}
              >
                {/* Column Header */}
                <div className="p-4 flex items-center justify-between border-b border-slate-200/70 bg-white/70 rounded-t-xl backdrop-blur-xs">
                  <div className="flex items-center gap-2">
                    <StatusIcon size={16} className={cfg.iconColor} />
                    <h4 className="text-sm font-bold text-slate-800">{cfg.label}</h4>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {colTasks.length}
                    </span>
                    {colPoints > 0 && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        {colPoints}p
                      </span>
                    )}
                  </div>
                </div>

                {/* Column Tasks Container */}
                <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1 min-h-[160px]">
                  {colTasks.map((task) => {
                    const isDraggable = canDragTask(task)
                    const isAssigned = isTaskAssignedToUser(task, user)
                    const prio = PRIORITY_BADGES[(task.priority || '').toUpperCase()] || PRIORITY_BADGES.LOW

                    return (
                      <div
                        key={task.id}
                        className={`bg-white rounded-xl p-4 shadow-xs border transition-all duration-150 group relative ${
                          isDraggable
                            ? 'cursor-grab active:cursor-grabbing hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5'
                            : 'cursor-not-allowed opacity-90 border-slate-200'
                        } ${
                          isDev && isAssigned
                            ? 'ring-2 ring-orange-500/30 border-orange-300 bg-gradient-to-br from-white via-white to-orange-50/20'
                            : 'border-slate-200/90'
                        }`}
                        draggable={isDraggable}
                        onDragStart={(e) => {
                          if (!isDraggable) {
                            e.preventDefault()
                            if (isDev && !isAssigned) {
                              setBlockedNote('You can only drag and drop tasks assigned to you.')
                              setTimeout(() => setBlockedNote(''), 3000)
                            }
                            return
                          }
                          setDragTaskId(task.id)
                        }}
                        onDragEnd={() => setDragTaskId(null)}
                        title={
                          isDev && !isAssigned
                            ? 'Only assigned developer can move this task'
                            : undefined
                        }
                      >
                        {/* Task Card Header: ID, Priority, Assigned Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            #TASK-{task.id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${prio.bg}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                              {prio.label}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <p className="text-sm font-semibold text-slate-800 mb-3 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                          {task.title}
                        </p>

                        {/* Assigned To You Chip */}
                        {isDev && isAssigned && (
                          <div className="mb-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-800 border border-orange-200">
                              <Check size={10} className="text-orange-600" />
                              Assigned to you
                            </span>
                          </div>
                        )}

                        {/* Card Footer: Points & Assignee */}
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-md">
                            <Layers size={11} className="text-slate-400" />
                            {task.points != null ? `${task.points} pts` : '—'}
                          </span>

                          {task.assigneeName || task.assignee ? (
                            <div className="flex items-center gap-1.5" title={`Assignee: ${task.assigneeName || task.assignee}`}>
                              <span className="text-[11px] font-medium text-slate-600 max-w-[110px] truncate">
                                {task.assigneeName || (typeof task.assignee === 'string' ? task.assignee : task.assignee.fullName)}
                              </span>
                              <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 shrink-0">
                                <User size={11} className="text-slate-600" />
                              </div>
                            </div>
                          ) : (
                            <div
                              className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic"
                              title="No assignee"
                            >
                              <User size={12} />
                              <span>Unassigned</span>
                            </div>
                          )}
                        </div>

                        {/* Lock Icon for Developer unassigned tasks */}
                        {isDev && !isAssigned && (
                          <div
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800/80 text-white rounded p-1 text-[10px] flex items-center gap-1 pointer-events-none"
                            title="Locked"
                          >
                            <Lock size={10} />
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 bg-transparent rounded-xl border-2 border-dashed border-slate-200 text-center h-full min-h-[140px]">
                      <StatusIcon size={20} className="text-slate-300 mb-1" />
                      <p className="text-xs font-semibold text-slate-400">No tasks in {cfg.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Drop here to update status</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Analytics & AI Coach Section (Placed below Kanban Board) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mt-2">
        {/* Burndown Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
                <TrendingDown size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Sprint Burndown Telemetry</h3>
                <p className="text-xs text-slate-500">Real-time ideal vs actual velocity tracking</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {metrics.totalPoints - metrics.donePoints} pts remaining
            </span>
          </div>

          {burndownError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
              <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">Burndown unavailable</p>
              <p className="text-xs text-slate-400 mt-1">{burndownError}</p>
            </div>
          ) : burndown.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
              <TrendingDown className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No burndown data recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Move tasks across columns to plot velocity.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-[220px]">
              <BurndownChart data={burndown} />
            </div>
          )}
        </div>

        {/* AI Sprint Coach */}
        <div className="bg-gradient-to-br from-white via-white to-orange-50/40 rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Sprint Coach</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                    Scrum Intelligence
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  aiLoading
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
                onClick={runSprintAnalysis}
                disabled={aiLoading}
              >
                <Sparkles size={13} className={aiLoading ? 'animate-spin' : ''} />
                <span>{aiLoading ? 'Analyzing...' : 'Analyze'}</span>
              </button>
            </div>

            {aiError && (
              <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs">
                {aiError}
              </div>
            )}

            <div className="bg-slate-50/70 rounded-xl border border-slate-200/70 p-3.5 max-h-[300px] overflow-y-auto">
              {aiLoading ? (
                <div className="space-y-3 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-orange-500 animate-spin" />
                    <span className="text-xs font-medium text-slate-600">Analyzing sprint workload, risks, and health...</span>
                  </div>
                  <div className="h-2.5 bg-slate-200 rounded-full w-full animate-pulse" />
                  <div className="h-2.5 bg-slate-200 rounded-full w-5/6 animate-pulse" />
                  <div className="h-2.5 bg-slate-200 rounded-full w-4/6 animate-pulse" />
                </div>
              ) : aiResult ? (
                <AiResponseFormatter content={aiResult} title="Sprint Health & Risk Assessment" />
              ) : (
                <div className="text-center py-6">
                  <Bot size={24} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500">
                    Click <strong className="text-slate-700">Analyze</strong> to generate structured AI feedback on workload distribution, risk factors, and actionable recommendations.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 text-[10px] text-slate-400 flex items-center gap-1 border-t border-slate-100">
            <Sparkles size={11} className="text-orange-500" />
            <span>Analyzes active tasks against delivery deadlines and story points</span>
          </div>
        </div>
      </div>
    </div>
  )
}