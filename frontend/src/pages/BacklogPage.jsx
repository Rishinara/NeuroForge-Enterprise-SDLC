import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { taskApi } from '../api/taskApi.js'
import { projectApi } from '../api/projectApi.js'
import { sprintApi } from '../api/sprintApi.js'
import { aiApi } from '../api/aiApi.js'
import { api, extractErrorMessage } from '../api/client.js'
import { orgApi } from '../api/orgApi.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Can from '../components/Can.jsx'

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';

const PRIORITY_STYLE = {
  HIGH: 'bg-red-100 text-red-800',
  High: 'bg-red-100 text-red-800',
  MEDIUM: 'bg-orange-100 text-orange-800',
  Medium: 'bg-orange-100 text-orange-800',
  LOW: 'bg-slate-100 text-slate-700',
  Low: 'bg-slate-100 text-slate-700',
  CRITICAL: 'bg-red-200 text-red-900',
}

const CAN_MANAGE = [ROLES.PROJECT_MANAGER, ROLES.SUPER_ADMIN]


export default function BacklogPage() {
  const { projectId = 'p1' } = useParams()
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const [items, setItems] = useState([])
  const [sprints, setSprints] = useState([])
  const [projectData, setProjectData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [endpointMissing, setEndpointMissing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', points: 3, priority: 'Medium', labels: '', teamId: '', assigneeId: '' })
  const [teams, setTeams] = useState([])
  const [teamMembers, setTeamMembers] = useState([])

  const [showSprintForm, setShowSprintForm] = useState(false)
  const [sprintForm, setSprintForm] = useState({ name: '', goal: '', startDate: '', endDate: '' })
  const [dragTaskId, setDragTaskId] = useState(null)

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
  const [aiTab, setAiTab] = useState('task') // 'task' or 'project'
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
      const [tasksRes, sprintsRes, projectRes] = await Promise.all([
        api.get(`/tasks/project/${projectId}/backlog`),
        sprintApi.listProjectSprints(projectId).catch(() => ({ data: [] })),
        projectApi.getProject(projectId).catch(() => ({ data: null }))
      ])
      if (!Array.isArray(tasksRes.data)) throw new Error('Unexpected response shape')
      setItems(tasksRes.data)
      setSprints(Array.isArray(sprintsRes.data) ? sprintsRes.data : [])
      setProjectData(projectRes.data)
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

  // Load teams for assignment
  useEffect(() => {
    if (!user?.orgId || !projectData) return
    orgApi.listTeamsWithMembers(user.orgId)
      .then((res) => {
        const allTeams = Array.isArray(res.data) ? res.data : []
        const assignedTeamIds = new Set(projectData.assignedTeams?.map(t => t.id) || [])
        setTeams(allTeams.filter(t => assignedTeamIds.has(t.id)))
      })
      .catch(() => setTeams([]))
  }, [user?.orgId, projectData])

  // When team selection changes, update assignee list
  useEffect(() => {
    if (!form.teamId) {
      const projDevs = (projectData?.team || []).filter(m => m.projectRole === 'DEVELOPER' || m.role === 'DEVELOPER' || m.user?.role === 'DEVELOPER')
      setTeamMembers(projDevs)
      setForm((f) => ({ ...f, assigneeId: '' }))
      return
    }
    const selectedTeam = teams.find((t) => String(t.id) === String(form.teamId))
    const rawMembers = selectedTeam?.members || selectedTeam?.users || []
    const members = rawMembers.filter(m => m.role === 'DEVELOPER' || m.user?.role === 'DEVELOPER')
    setTeamMembers(members)
    setForm((f) => ({ ...f, assigneeId: '' }))
  }, [form.teamId, teams, projectData])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const numericProjId = Number(projectId)
    const payload = {
      title: form.title.trim(),
      storyPoints: Math.max(1, Math.min(13, Number(form.points) || 1)),
      priority: (form.priority || 'MEDIUM').toUpperCase(),
      labels: form.labels.split(',').map((l) => l.trim()).filter(Boolean),
      sprintId: null,
      teamId: form.teamId ? Number(form.teamId) : null,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
    }
    try {
      const res = await taskApi.createTask(numericProjId, payload)
      setItems((prev) => [res.data, ...prev])
    } catch (err) {
      setError(extractErrorMessage(err))
      return
    }
    setForm({ title: '', points: 3, priority: 'Medium', labels: '', teamId: '', assigneeId: '' })
    setShowForm(false)
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

  async function handleCreateSprint(e) {
    e.preventDefault()
    if (!sprintForm.name.trim() || !sprintForm.startDate || !sprintForm.endDate) return

    if (projectData?.startDate && sprintForm.startDate < projectData.startDate) {
      setError(`Sprint start date cannot be before project start date (${projectData.startDate})`)
      return
    }
    if (projectData?.endDate && sprintForm.endDate > projectData.endDate) {
      setError(`Sprint end date cannot be after project deadline (${projectData.endDate})`)
      return
    }
    if (sprintForm.startDate > sprintForm.endDate) {
      setError('Sprint start date cannot be after end date')
      return
    }

    const numericProjId = Number(projectId)
    const payload = {
      ...sprintForm,
      projectId: isNaN(numericProjId) ? null : numericProjId,
    }
    try {
      const res = await sprintApi.createSprint(payload)
      setSprints((prev) => [res.data, ...prev])
      setShowSprintForm(false)
      setSprintForm({ name: '', goal: '', startDate: '', endDate: '' })
      setError('')
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  async function handleDropToSprint(targetSprintId) {
    if (!dragTaskId) return
    const taskId = dragTaskId
    setDragTaskId(null)

    // Optimistic UI update
    setItems((prev) => prev.filter(t => t.id !== taskId))

    try {
      await taskApi.assignSprint(taskId, targetSprintId)
    } catch (err) {
      // Revert on failure by reloading
      load()
      setError(extractErrorMessage(err))
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

  const totalPoints = items.reduce((sum, i) => sum + (i.points || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      {/* tabs */}
      <div className="flex space-x-6 border-b border-slate-200 mb-6 pb-2">
        <Link to={`/projects/${projectId}/backlog`} className="text-orange-600 border-b-2 border-orange-500 pb-2 text-base font-semibold">Backlog</Link>
        <Link to={`/projects/${projectId}/board`} className="text-slate-500 hover:text-slate-700 pb-2 text-base font-medium">Board</Link>
      </div>

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Project Backlog</h1>
          <p className="text-sm text-slate-700 mt-1">{items.length} items · {totalPoints} points total</p>
        </div>
        <div className="flex items-center gap-3 justify-end">
          <button className="px-4 py-2 bg-white border border-slate-200 text-sm font-medium text-slate-700 rounded-lg shadow-sm hover:bg-slate-50" onClick={() => setShowAiCopilot(s => !s)}>
            {showAiCopilot ? 'Hide AI Copilot' : '🤖 AI Copilot'}
          </button>
          <Can roles={CAN_MANAGE}>
            <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg shadow-sm" onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Cancel' : '+ Add item'}
            </button>
          </Can>
        </div>
      </div>

      {endpointMissing && (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Project Backlog Unavailable</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            The backlog for this project could not be found or has not been initialized yet. Create a project to start managing tasks.
          </p>
        </div>
      )}

      {error && !endpointMissing && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <p>Could not load the backlog. ({error})</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 w-full flex flex-col gap-6">
          {showForm && (
            <form className="bg-white rounded-xl shadow-md border border-slate-200 p-6" onSubmit={handleAdd}>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Backlog Item</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                  <input
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Slot availability calendar view"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Story points</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={form.points}
                      onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    >
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Labels (comma separated)</label>
                  <input
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={form.labels}
                    onChange={(e) => setForm((f) => ({ ...f, labels: e.target.value }))}
                    placeholder="frontend, payments"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Assign Team</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      value={form.teamId}
                      onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
                    >
                      <option value="">— No team —</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Assignee</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      value={form.assigneeId}
                      onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
                    >
                      <option value="">— Unassigned —</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.fullName || m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg shadow-sm" type="submit">
                  Add to backlog
                </button>
              </div>
            </form>
          )}

          {/* Sprints Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Sprints</h3>
              <Can roles={CAN_MANAGE}>
                <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors" onClick={() => setShowSprintForm((s) => !s)}>
                  {showSprintForm ? 'Cancel' : '+ Create sprint'}
                </button>
              </Can>
            </div>

            {showSprintForm && (
              <form className="bg-slate-50 rounded-lg border border-slate-100 p-5 mb-5" onSubmit={handleCreateSprint}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Sprint name *</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500" required value={sprintForm.name} onChange={e => setSprintForm(f => ({ ...f, name: e.target.value }))} placeholder="Sprint 1" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Goal</label>
                    <input className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500" value={sprintForm.goal} onChange={e => setSprintForm(f => ({ ...f, goal: e.target.value }))} placeholder="Complete authentication flow" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Start Date * {projectData?.startDate ? `(Min: ${projectData.startDate})` : ''}
                      </label>
                      <input 
                        type="date" 
                        required 
                        min={projectData?.startDate || undefined}
                        max={sprintForm.endDate || projectData?.endDate || undefined}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" 
                        value={sprintForm.startDate} 
                        onChange={e => setSprintForm(f => ({ ...f, startDate: e.target.value }))} 
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        End Date * {projectData?.endDate ? `(Max Deadline: ${projectData.endDate})` : ''}
                      </label>
                      <input 
                        type="date" 
                        required 
                        min={sprintForm.startDate || projectData?.startDate || undefined}
                        max={projectData?.endDate || undefined}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white" 
                        value={sprintForm.endDate} 
                        onChange={e => setSprintForm(f => ({ ...f, endDate: e.target.value }))} 
                      />
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg shadow-sm" type="submit">Save Sprint</button>
                </div>
              </form>
            )}

            {sprints.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-600">No sprints created yet</p>
                <p className="text-xs text-slate-400 mt-1">Create a sprint to start organizing tasks.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sprints.map(sprint => (
                  <div
                    key={sprint.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition-all duration-200"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-orange-500', 'bg-orange-50');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-orange-500', 'bg-orange-50');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-orange-500', 'bg-orange-50');
                      handleDropToSprint(sprint.id);
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="text-base font-semibold text-slate-900">{sprint.name}</h4>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${sprint.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>
                          {formatEnum(sprint.status)}
                        </span>
                      </div>
                      <Link to={`/projects/${projectId}/sprints/${sprint.id}/board`} className="text-xs font-medium text-orange-600 hover:text-orange-700">View Board →</Link>
                    </div>
                    {sprint.goal && <p className="text-sm text-slate-700 mb-2">{sprint.goal}</p>}
                    <p className="text-xs font-medium text-slate-500">{sprint.startDate} to {sprint.endDate} — Drag backlog items here to assign</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Backlog</h3>
            </div>

            <div className="p-0">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">Loading backlog…</div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-t border-slate-200 text-center">
                  <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-medium text-slate-600">Backlog is empty</p>
                  <p className="text-xs text-slate-400 mt-1">Add items to populate the backlog.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const pClass = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.Medium
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors ${CAN_MANAGE.includes(role) ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        draggable={CAN_MANAGE.includes(role)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', item.id)
                          setDragTaskId(item.id)
                        }}
                      >
                        <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                          {item.storyPoints ?? item.points ?? 0}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {item.assigneeName && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                {item.assigneeName}
                              </span>
                            )}
                            {item.teamName && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {item.teamName}
                              </span>
                            )}
                            {item.specTitle && <p className="text-xs text-slate-500 truncate">Traces to: {item.specTitle}</p>}
                          </div>
                        </div>
                        <div className="hidden md:flex flex-wrap gap-1 items-center justify-end">
                          {(item.labels || []).map((l) => (
                            <span key={l} className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {l}
                            </span>
                          ))}
                        </div>
                        <span className={`flex-shrink-0 text-xs font-medium px-2 py-1 rounded-md ${pClass}`}>
                          {formatEnum(item.priority)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Copilot Panel */}
        {showAiCopilot && (
          <div className="w-full lg:w-96 flex-shrink-0 sticky top-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <span>🤖</span> NeuroForge AI Copilot
              </h3>

              <div className="flex p-1 bg-slate-100 rounded-lg mb-5">
                <button
                  type="button"
                  onClick={() => setAiTab('task')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-shadow ${aiTab === 'task' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Task Assist
                </button>
                <button
                  type="button"
                  onClick={() => setAiTab('project')}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-shadow ${aiTab === 'project' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Project Risks
                </button>
              </div>

              {aiError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                  {aiError}
                </div>
              )}

              {aiTab === 'task' ? (
                <div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Task Title</label>
                    <input
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={aiForm.title}
                      onChange={e => setAiForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Integrate Stripe payment gateway"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Description (optional)</label>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={3}
                      value={aiForm.description}
                      onChange={e => setAiForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Provide details for better recommendations…"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-5">
                    <button type="button" className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50" onClick={() => runAiTaskTool('estimate')} disabled={aiLoading}>
                      Estimate Points
                    </button>
                    <button type="button" className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50" onClick={() => runAiTaskTool('priority')} disabled={aiLoading}>
                      Recommend Priority
                    </button>
                    <button type="button" className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50" onClick={() => runAiTaskTool('breakdown')} disabled={aiLoading}>
                      Break Down
                    </button>
                    <button type="button" className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50" onClick={() => runAiTaskTool('criteria')} disabled={aiLoading}>
                      Gen Criteria
                    </button>
                    <button type="button" className="col-span-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50" onClick={() => runAiTaskTool('enhance')} disabled={aiLoading}>
                      Enhance Task Description
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-5">
                  <p className="text-sm text-slate-600 mb-4">
                    Analyze all current tasks in the backlog to identify delivery risks, dependency bottlenecks, and testing challenges.
                  </p>
                  <button type="button" className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50" onClick={runAiProjectRisk} disabled={aiLoading}>
                    {aiLoading ? 'Analyzing…' : 'Run Backlog Risk Analysis'}
                  </button>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4">
                <label className="block text-xs font-medium text-slate-500 mb-2">AI Response</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[120px] max-h-[250px] overflow-y-auto text-sm font-mono whitespace-pre-wrap text-slate-800">
                  {aiLoading ? (
                    <div className="animate-pulse flex flex-col gap-2">
                      <div className="h-2.5 bg-slate-200 rounded w-full"></div>
                      <div className="h-2.5 bg-slate-200 rounded w-4/5"></div>
                      <div className="h-2.5 bg-slate-200 rounded w-3/5"></div>
                    </div>
                  ) : aiResult ? aiResult : <span className="text-slate-400">Run a tool to see AI insights here.</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}