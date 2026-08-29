import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { api, extractErrorMessage } from '../api/client.js'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Plus,
  X,
  ExternalLink,
  ShieldAlert,
  Search,
  Trash2
} from 'lucide-react'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const PRIORITY_BADGES = {
  LOW: 'bg-blue-50 text-blue-700 border-blue-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200'
}

const STATUS_BADGES = {
  OPEN: 'bg-rose-50 text-rose-700 border-rose-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  READY_FOR_QA: 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-400/30',
  RETESTING: 'bg-purple-50 text-purple-700 border-purple-200',
  CLOSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REOPENED: 'bg-red-100 text-red-800 border-red-300 font-bold'
}

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';

export default function BugsPage() {
  const { projectId } = useParams()
  const { role, user } = useAuth()
  
  const [bugs, setBugs] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('DEFAULT')

  // Modals
  const [newBugOpen, setNewBugOpen] = useState(false)
  const [retestBug, setRetestBug] = useState(null)
  const [viewBug, setViewBug] = useState(null)

  // Forms
  const [newBug, setNewBug] = useState({
    title: '',
    description: '',
    taskId: '',
    severity: 'MEDIUM',
    priority: 'MEDIUM',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    attachmentUrl: ''
  })

  const [retestForm, setRetestForm] = useState({
    comments: '',
    attachmentUrl: ''
  })
  const [retestError, setRetestError] = useState('')

  const isQa = role === ROLES.QA_TESTER || role === ROLES.SUPER_ADMIN
  const isDev = [ROLES.DEVELOPER, ROLES.FRONTEND_DEVELOPER, ROLES.BACKEND_DEVELOPER].includes(role)

  // Delete Bug (QA Only)
  const handleDeleteBug = async (bugId) => {
    if (!window.confirm('Are you sure you want to delete this bug? This action cannot be undone.')) return
    try {
      await api.delete(`/projects/${projectId}/bugs/${bugId}`)
      loadData()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  // Check if bug is assigned to current user
  const isAssignedToUser = useCallback((bug) => {
    if (!user || !bug) return false
    const currentId = String(user.id || user.userId || '')
    const bugAssigneeId = String(bug.assigneeId || '')
    if (currentId && bugAssigneeId && currentId === bugAssigneeId) return true
    if (user.fullName && bug.assigneeName && user.fullName.trim().toLowerCase() === bug.assigneeName.trim().toLowerCase()) return true
    if (user.email && bug.assigneeEmail && user.email.trim().toLowerCase() === bug.assigneeEmail.trim().toLowerCase()) return true
    return false
  }, [user])

  // Check if bug was reported by current user
  const isReportedByUser = useCallback((bug) => {
    if (!user || !bug) return false
    const currentId = String(user.id || user.userId || '')
    const bugReporterId = String(bug.reporterId || '')
    if (currentId && bugReporterId && currentId === bugReporterId) return true
    if (user.fullName && bug.reporterName && user.fullName.trim().toLowerCase() === bug.reporterName.trim().toLowerCase()) return true
    return false
  }, [user])

  // Load bugs and tasks for project
  const loadData = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      // 1. Fetch bugs
      const bugsRes = await api.get(`/projects/${projectId}/bugs`).catch(() => ({ data: [] }))
      setBugs(Array.isArray(bugsRes.data) ? bugsRes.data : [])

      // 2. Fetch project backlog & sprint tasks to populate task dropdown
      const backlogRes = await api.get(`/tasks/project/${projectId}/backlog`).catch(() => ({ data: [] }))
      const sprintsRes = await api.get(`/sprints/project/${projectId}`).catch(() => ({ data: [] }))

      let allProjectTasks = Array.isArray(backlogRes.data) ? [...backlogRes.data] : []

      if (Array.isArray(sprintsRes.data)) {
        const sprintBoards = await Promise.all(
          sprintsRes.data.map(s => api.get(`/tasks/${s.id}/board`).catch(() => ({ data: null })))
        )
        sprintBoards.forEach(bRes => {
          if (bRes.data) {
            const b = bRes.data
            const boardTasks = [
              ...(b.todo || []),
              ...(b.inProgress || []),
              ...(b.codeReview || []),
              ...(b.testing || []),
              ...(b.done || [])
            ]
            boardTasks.forEach(bt => {
              if (!allProjectTasks.some(t => t.id === bt.id)) {
                allProjectTasks.push(bt)
              }
            })
          }
        })
      }

      setTasks(allProjectTasks)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Selected Task in New Bug Modal
  const selectedTask = tasks.find(t => String(t.id) === String(newBug.taskId))
  const selectedTaskHasDev = Boolean(selectedTask?.assigneeId || selectedTask?.assigneeName)

  // Handle Bug Creation (QA)
  const handleCreateBug = async (e) => {
    e.preventDefault()
    if (!newBug.title.trim()) {
      setError('Bug Title is required.')
      return
    }
    if (!newBug.taskId) {
      setError('Affected Task selection is mandatory.')
      return
    }
    if (!selectedTaskHasDev) {
      setError('This task does not have a Developer assigned. Please assign a Developer to the task before reporting this bug.')
      return
    }

    try {
      await api.post(`/projects/${projectId}/bugs`, {
        ...newBug,
        title: newBug.title.trim(),
        projectId: Number(projectId),
        taskId: Number(newBug.taskId)
      })
      setNewBugOpen(false)
      setNewBug({
        title: '',
        description: '',
        taskId: '',
        severity: 'MEDIUM',
        priority: 'MEDIUM',
        stepsToReproduce: '',
        expectedResult: '',
        actualResult: '',
        attachmentUrl: ''
      })
      setError('')
      loadData()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  // Developer Status Update (OPEN -> IN_PROGRESS -> READY_FOR_QA)
  const handleDeveloperStatusUpdate = async (bugId, newStatus) => {
    try {
      const bug = bugs.find(b => b.id === bugId)
      if (!bug) return
      await api.put(`/projects/${projectId}/bugs/${bugId}`, {
        title: bug.title,
        description: bug.description,
        status: newStatus,
        priority: bug.priority,
        severity: bug.severity,
        projectId: Number(projectId),
        taskId: bug.taskId ? Number(bug.taskId) : null,
        sprintId: bug.sprintId ? Number(bug.sprintId) : null,
        assigneeId: bug.assigneeId ? Number(bug.assigneeId) : null,
        stepsToReproduce: bug.stepsToReproduce,
        expectedResult: bug.expectedResult,
        actualResult: bug.actualResult,
        attachmentUrl: bug.attachmentUrl,
        retestComments: bug.retestComments
      })
      loadData()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  // QA Retest Action (PASS -> CLOSED / FAIL -> REOPENED)
  const handleQaRetestDecision = async (pass) => {
    if (!retestBug) return
    const targetStatus = pass ? 'CLOSED' : 'REOPENED'
    try {
      await api.put(`/projects/${projectId}/bugs/${retestBug.id}`, {
        title: retestBug.title,
        description: retestBug.description,
        status: targetStatus,
        priority: retestBug.priority,
        severity: retestBug.severity,
        projectId: Number(projectId),
        taskId: retestBug.taskId ? Number(retestBug.taskId) : null,
        sprintId: retestBug.sprintId ? Number(retestBug.sprintId) : null,
        assigneeId: retestBug.assigneeId ? Number(retestBug.assigneeId) : null,
        stepsToReproduce: retestBug.stepsToReproduce,
        expectedResult: retestBug.expectedResult,
        actualResult: retestBug.actualResult,
        retestComments: retestForm.comments,
        attachmentUrl: retestForm.attachmentUrl || retestBug.attachmentUrl
      })
      setRetestBug(null)
      setRetestForm({ comments: '', attachmentUrl: '' })
      setRetestError('')
      loadData()
    } catch (err) {
      setRetestError(extractErrorMessage(err))
    }
  }

  // Filtered Bugs based on Role & Tabs
  const readyForQaCount = bugs.filter(b => b.status === 'READY_FOR_QA').length

  const getFilteredBugs = () => {
    let result = [...bugs]

    // Search filter across all bug & task properties
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      const cleanQ = q.replace(/^bug-/i, '').replace(/^task-/i, '')
      
      result = result.filter(b => {
        const idStr = String(b.id || '')
        const taskIdStr = String(b.taskId || '')
        const bugFormattedId = `bug-${b.id}`
        const taskFormattedId = `task-${b.taskId}`

        return (
          idStr.includes(cleanQ) ||
          taskIdStr.includes(cleanQ) ||
          bugFormattedId.includes(q) ||
          taskFormattedId.includes(q) ||
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (b.taskTitle && b.taskTitle.toLowerCase().includes(q)) ||
          (b.assigneeName && b.assigneeName.toLowerCase().includes(q)) ||
          (b.reporterName && b.reporterName.toLowerCase().includes(q)) ||
          (b.priority && b.priority.toLowerCase().includes(q)) ||
          (b.severity && b.severity.toLowerCase().includes(q)) ||
          (b.status && b.status.toLowerCase().replace(/_/g, ' ').includes(q)) ||
          (b.stepsToReproduce && b.stepsToReproduce.toLowerCase().includes(q)) ||
          (b.expectedResult && b.expectedResult.toLowerCase().includes(q)) ||
          (b.actualResult && b.actualResult.toLowerCase().includes(q))
        )
      })
    }

    // QA Filtering
    if (isQa) {
      if (activeTab === 'READY_FOR_QA') {
        return result.filter(b => b.status === 'READY_FOR_QA')
      }
      if (activeTab === 'MY_REPORTED') {
        return result.filter(b => isReportedByUser(b))
      }
      return result
    }

    // Developer Filtering
    if (isDev) {
      if (activeTab === 'READY_FOR_QA') {
        return result.filter(b => isAssignedToUser(b) && b.status === 'READY_FOR_QA')
      }
      if (activeTab === 'CLOSED') {
        return result.filter(b => isAssignedToUser(b) && b.status === 'CLOSED')
      }
      if (activeTab === 'ALL_PROJECT_BUGS') {
        return result
      }
      // Active assigned bugs by default
      const assignedBugs = result.filter(b => isAssignedToUser(b) && (b.status === 'OPEN' || b.status === 'IN_PROGRESS' || b.status === 'REOPENED'))
      // If developer has no active assigned bugs, fallback to all project bugs
      return assignedBugs.length > 0 ? assignedBugs : result
    }

    // PM / Admin / Others
    if (activeTab === 'OPEN') {
      return result.filter(b => b.status === 'OPEN' || b.status === 'IN_PROGRESS' || b.status === 'REOPENED')
    }
    if (activeTab === 'CLOSED') {
      return result.filter(b => b.status === 'CLOSED')
    }
    return result
  }

  const filteredBugs = getFilteredBugs()

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 w-full my-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
        <p className="text-sm font-medium text-slate-500">Loading project bug workflow...</p>
      </div>
    )
  }

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-orange-500" size={26} />
            Bug Tracking & QA Retest Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            End-to-end QA Defect Reporting → Developer Fix → QA Verification & Closure workflow.
          </p>
        </div>

        {isQa && (
          <button
            onClick={() => setNewBugOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={18} />
            Report New Bug
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm flex items-center gap-2">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {isQa && (
            <>
              <button
                onClick={() => setActiveTab('DEFAULT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === 'DEFAULT' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Bugs ({bugs.length})
              </button>

              <button
                onClick={() => setActiveTab('READY_FOR_QA')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'READY_FOR_QA' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'}`}
              >
                <Clock size={14} />
                Bugs Ready for Retest
                {readyForQaCount > 0 && (
                  <span className="bg-amber-600 text-white px-1.5 py-0.2 text-[10px] rounded-full font-bold">
                    {readyForQaCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('MY_REPORTED')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === 'MY_REPORTED' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Reported by Me
              </button>
            </>
          )}

          {isDev && (
            <>
              <button
                onClick={() => setActiveTab('DEFAULT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === 'DEFAULT' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                My Active Bugs ({bugs.filter(b => isAssignedToUser(b) && (b.status === 'OPEN' || b.status === 'IN_PROGRESS' || b.status === 'REOPENED')).length})
              </button>

              <button
                onClick={() => setActiveTab('READY_FOR_QA')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === 'READY_FOR_QA' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Pending QA Retest ({bugs.filter(b => isAssignedToUser(b) && b.status === 'READY_FOR_QA').length})
              </button>

              <button
                onClick={() => setActiveTab('ALL_PROJECT_BUGS')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === 'ALL_PROJECT_BUGS' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Project Bugs ({bugs.length})
              </button>

              <button
                onClick={() => setActiveTab('CLOSED')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === 'CLOSED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Closed History ({bugs.filter(b => isAssignedToUser(b) && b.status === 'CLOSED').length})
              </button>
            </>
          )}

          {!isQa && !isDev && (
            <>
              <button
                onClick={() => setActiveTab('DEFAULT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'DEFAULT' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Project Bugs ({bugs.length})
              </button>
              <button
                onClick={() => setActiveTab('OPEN')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'OPEN' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Active / Open
              </button>
              <button
                onClick={() => setActiveTab('CLOSED')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === 'CLOSED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Closed
              </button>
            </>
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, title, task, dev, status..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200"
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Bugs List */}
      <div className="space-y-4">
        {filteredBugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-200 text-center">
            <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">No Bugs Found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {isQa ? 'Report bugs against affected tasks to route them automatically to assigned developers.' : 'No bugs matching the current filter.'}
            </p>
          </div>
        ) : (
          filteredBugs.map(bug => {
            const assignedToMe = isAssignedToUser(bug)
            return (
              <div
                key={bug.id}
                className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">BUG-{bug.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_BADGES[bug.status] || 'bg-slate-100'}`}>
                      {formatEnum(bug.status)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${PRIORITY_BADGES[bug.priority] || 'bg-slate-100'}`}>
                      Priority: {bug.priority}
                    </span>
                    {bug.severity && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-slate-100 text-slate-600 border-slate-200">
                        Severity: {bug.severity}
                      </span>
                    )}
                    {assignedToMe && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        Assigned to You
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => setViewBug(bug)}
                    className="text-base font-bold text-slate-900 cursor-pointer hover:text-orange-600 transition-colors flex items-center gap-2"
                  >
                    {bug.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1 font-semibold text-blue-600">
                      Linked Task: {bug.taskTitle ? `TASK-${bug.taskId} (${bug.taskTitle})` : 'Unlinked Task'}
                    </div>
                    <div>Assigned Dev: <span className="font-semibold text-slate-700">{bug.assigneeName || 'Unassigned'}</span></div>
                    <div>QA Reporter: <span className="font-semibold text-slate-700">{bug.reporterName || 'Unknown'}</span></div>
                  </div>

                  {bug.retestComments && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                      <span className="font-bold">QA Retest Comment:</span> {bug.retestComments}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  
                  {/* QA RETEST ACTIONS */}
                  {isQa && bug.status === 'READY_FOR_QA' && (
                    <button
                      onClick={() => {
                        setRetestBug(bug)
                        setRetestForm({ comments: '', attachmentUrl: '' })
                        setRetestError('')
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 animate-pulse"
                    >
                      <CheckCircle2 size={14} />
                      Retest Bug Fix
                    </button>
                  )}

                  {/* DEVELOPER ACTIONS */}
                  {isDev && (assignedToMe || activeTab === 'ALL_PROJECT_BUGS') && (
                    <>
                      {(bug.status === 'OPEN' || bug.status === 'REOPENED') && (
                        <button
                          onClick={() => handleDeveloperStatusUpdate(bug.id, 'IN_PROGRESS')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <Play size={14} />
                          Start Working
                        </button>
                      )}

                      {bug.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleDeveloperStatusUpdate(bug.id, 'READY_FOR_QA')}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={14} />
                          Mark Ready for QA
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => setViewBug(bug)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    View Details
                  </button>

                  {isQa && (
                    <button
                      onClick={() => handleDeleteBug(bug.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      title="Delete Bug (QA Only)"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* REPORT NEW BUG MODAL (QA) */}
      {newBugOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="text-orange-500" size={20} />
                Report New Defect / Bug
              </h3>
              <button onClick={() => setNewBugOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBug} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bug Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Login button unresponsive on Safari mobile"
                  value={newBug.title}
                  onChange={e => setNewBug({ ...newBug, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* MANDATORY AFFECTED TASK SELECTION */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Affected Task * <span className="text-slate-400 font-normal lowercase">(Developer auto-identified)</span>
                </label>
                <select
                  required
                  value={newBug.taskId}
                  onChange={e => setNewBug({ ...newBug, taskId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">-- Select Affected Task --</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      TASK-{t.id} : {t.title} {t.assigneeName ? `(Dev: ${t.assigneeName})` : '(No Dev Assigned)'}
                    </option>
                  ))}
                </select>

                {/* AUTOMATIC DEVELOPER IDENTIFICATION PREVIEW & EDGE CASE ALERT */}
                {selectedTask && (
                  <div className="mt-2">
                    {selectedTaskHasDev ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center justify-between">
                        <span>Assigned Developer: <strong className="font-bold">{selectedTask.assigneeName || 'Assigned'}</strong></span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Auto-Routed</span>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center gap-2">
                        <AlertTriangle size={16} className="shrink-0 text-red-600" />
                        <span>This task does not have a Developer assigned. Please assign a Developer to the task before reporting this bug.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Severity</label>
                  <select
                    value={newBug.severity}
                    onChange={e => setNewBug({ ...newBug, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={newBug.priority}
                    onChange={e => setNewBug({ ...newBug, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Steps to Reproduce</label>
                <textarea
                  rows={3}
                  placeholder="1. Open login page&#10;2. Enter valid credentials&#10;3. Click login button"
                  value={newBug.stepsToReproduce}
                  onChange={e => setNewBug({ ...newBug, stepsToReproduce: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Result</label>
                  <textarea
                    rows={2}
                    placeholder="User should navigate to dashboard"
                    value={newBug.expectedResult}
                    onChange={e => setNewBug({ ...newBug, expectedResult: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Actual Result</label>
                  <textarea
                    rows={2}
                    placeholder="Button spins infinitely without response"
                    value={newBug.actualResult}
                    onChange={e => setNewBug({ ...newBug, actualResult: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Attachment / Screenshot URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newBug.attachmentUrl}
                  onChange={e => setNewBug({ ...newBug, attachmentUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewBugOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!selectedTaskHasDev}
                  className={`px-5 py-2 text-white rounded-xl text-sm font-semibold transition-all ${selectedTaskHasDev ? 'bg-orange-500 hover:bg-orange-600 shadow-xs' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                  Save & Route Bug
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QA RETEST MODAL (PASS -> CLOSED / FAIL -> REOPENED) */}
      {retestBug && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="text-amber-500" size={20} />
                QA Retest Verification — BUG-{retestBug.id}
              </h3>
              <button onClick={() => setRetestBug(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {retestError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
                {retestError}
              </div>
            )}

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="font-bold text-slate-900 text-sm">{retestBug.title}</div>
              <div>Linked Task: <span className="font-semibold text-blue-600">TASK-{retestBug.taskId} ({retestBug.taskTitle})</span></div>
              <div>Developer: <span className="font-semibold text-slate-700">{retestBug.assigneeName}</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">QA Retest Comments & Evidence</label>
              <textarea
                rows={3}
                placeholder="Enter retest findings, verification steps, or failure reasons..."
                value={retestForm.comments}
                onChange={e => setRetestForm({ ...retestForm, comments: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Retest Evidence URL (Optional)</label>
              <input
                type="url"
                placeholder="https://..."
                value={retestForm.attachmentUrl}
                onChange={e => setRetestForm({ ...retestForm, attachmentUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setRetestBug(null)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleQaRetestDecision(false)}
                  className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  FAIL → REOPEN BUG
                </button>

                <button
                  type="button"
                  onClick={() => handleQaRetestDecision(true)}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  PASS → CLOSE BUG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW BUG DETAILS MODAL */}
      {viewBug && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-slate-400">BUG-{viewBug.id}</span>
                <h3 className="text-lg font-bold text-slate-900">{viewBug.title}</h3>
              </div>
              <button onClick={() => setViewBug(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>Status: <span className="font-bold text-slate-800">{formatEnum(viewBug.status)}</span></div>
              <div>Priority: <span className="font-bold text-slate-800">{viewBug.priority}</span></div>
              <div>Severity: <span className="font-bold text-slate-800">{viewBug.severity || 'N/A'}</span></div>
              <div>Linked Task: <span className="font-bold text-blue-600">TASK-{viewBug.taskId} ({viewBug.taskTitle})</span></div>
              <div>Assigned Dev: <span className="font-bold text-slate-800">{viewBug.assigneeName || 'Unassigned'}</span></div>
              <div>QA Reporter: <span className="font-bold text-slate-800">{viewBug.reporterName || 'Unknown'}</span></div>
            </div>

            {viewBug.description && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Description</h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">{viewBug.description}</p>
              </div>
            )}

            {viewBug.stepsToReproduce && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Steps to Reproduce</h4>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">{viewBug.stepsToReproduce}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {viewBug.expectedResult && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Expected Result</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">{viewBug.expectedResult}</p>
                </div>
              )}
              {viewBug.actualResult && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Actual Result</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">{viewBug.actualResult}</p>
                </div>
              )}
            </div>

            {viewBug.attachmentUrl && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Attachment Evidence</h4>
                <a
                  href={viewBug.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 underline flex items-center gap-1"
                >
                  <ExternalLink size={14} />
                  {viewBug.attachmentUrl}
                </a>
              </div>
            )}

            {viewBug.retestComments && (
              <div>
                <h4 className="text-xs font-bold text-amber-800 uppercase mb-1">QA Retest Comments</h4>
                <p className="text-xs text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-200">{viewBug.retestComments}</p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewBug(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
