import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { projectApi } from '../api/projectApi.js'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import HealthBadge from '../components/HealthBadge.jsx'
import Tabs from '../components/Tabs.jsx'
import EditProjectModal from '../components/EditProjectModal.jsx'
import Can from '../components/Can.jsx'
import ClientDashboard from './ClientDashboard.jsx'

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const [project, setProject] = useState(null)
  const [progress, setProgress] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (projectId && isNaN(Number(projectId))) {
      projectApi.listProjects(user?.orgId)
        .then((res) => {
          const firstProj = res.data?.[0]
          if (firstProj?.id) {
            navigate(`/projects/${firstProj.id}`, { replace: true })
          } else {
            navigate('/projects', { replace: true })
          }
        })
        .catch(() => {
          navigate('/projects', { replace: true })
        })
    }
  }, [projectId, user?.orgId, navigate])

  const load = useCallback(async () => {
    if (!projectId || isNaN(Number(projectId))) return
    setLoading(true)
    setError('')
    try {
      const [projectRes, milestonesRes, progressRes] = await Promise.all([
        projectApi.getProject(projectId),
        projectApi.listMilestones(projectId),
        projectApi.getProjectProgress(projectId).catch(() => ({ data: null }))
      ])

      const proj = projectRes.data || null
      setProject(proj)
      setMilestones(Array.isArray(milestonesRes.data) ? milestonesRes.data : [])
      setProgress(progressRes?.data || null)
    } catch (err) {
      setError(extractErrorMessage(err))
      setProject(null)
      setMilestones([])
      setProgress(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, user?.orgId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center min-h-[400px]">
        <svg className="w-10 h-10 text-slate-300 mb-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm font-medium text-slate-500">Loading project details...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Link to="/projects" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm mb-6 w-fit">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to projects
        </Link>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error || 'Project not found or access denied.'}</p>
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the project "${project.name}"?`)) return
    try {
      await projectApi.deleteProject(projectId)
      if (localStorage.getItem('neuroforge_current_project_id') === String(projectId)) {
        localStorage.removeItem('neuroforge_current_project_id')
      }
      window.location.href = '/projects'
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await projectApi.updateProjectMemberRole(projectId, userId, newRole)
      load()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      <div>
        <Link to="/projects" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm mb-6 w-fit">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to projects
        </Link>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
              <HealthBadge status={project.health} />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <span className="px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 text-xs font-bold uppercase tracking-wider">
                {project.methodology === 'AGILE' ? 'Agile' : 'Waterfall'}
              </span>
              <span className="text-slate-300">•</span>
              <span>{project.startDate} <span className="text-slate-400 mx-1">→</span> {project.endDate}</span>
            </div>
          </div>

          <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN]}>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={`/projects/${projectId}/specs`}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Generate AI Spec
              </Link>
              <button
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
                onClick={() => setEditOpen(true)}
              >
                Edit project
              </button>
              <button
                className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </Can>
        </div>
      </div>

      <EditProjectModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
        onUpdated={load}
      />

      {role === ROLES.CLIENT ? (
        <ClientDashboard project={project} />
      ) : (
        <>
          <Tabs
            tabs={[
              { key: 'overview', label: 'Overview' },
              { key: 'milestones', label: 'Milestones' },
              { key: 'team', label: 'Team' },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Project Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-6 flex-grow">
              {project.description || 'No description provided.'}
            </p>
            {project.techStack && project.techStack.length > 0 && (
              <div className="mt-auto pt-4 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 mb-3">Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {progress && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm h-full flex flex-col justify-center">
              <h3 className="text-lg font-bold text-slate-900 mb-8">Project Progress</h3>
              <div className="flex flex-col gap-8">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-600">Task Completion</span>
                    <span className="text-sm font-bold text-slate-900">
                      {progress.completedTasks} / {progress.totalTasks} <span className="text-slate-400 font-medium ml-1">({progress.taskCompletionPercentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress.taskCompletionPercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-600">Story Points</span>
                    <span className="text-sm font-bold text-slate-900">
                      {progress.completedStoryPoints} / {progress.totalStoryPoints} <span className="text-slate-400 font-medium ml-1">({progress.pointCompletionPercentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress.pointCompletionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'milestones' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {milestones.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-slate-500">No milestones established for this project.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Milestone Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Target Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {milestones.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{m.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{m.expectedDeliveryDate || 'Not set'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${m.status === 'ACHIEVED' ? 'bg-emerald-100 text-emerald-700' :
                          m.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                            m.status === 'DELAYED' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                          }`}>
                          {m.status ? m.status.replace('_', ' ') : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'team' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Assigned Teams</h3>
            {!project.assignedTeams || project.assignedTeams.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No external teams assigned.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {project.assignedTeams.map(team => (
                  <div
                    key={team.id}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    {team.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">Project Members</h3>
            </div>
            {!project.team || project.team.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500">No members assigned to this project yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 sm:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-2/3">Member</th>
                      <th className="px-6 sm:px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">Project Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {project.team.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 sm:px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                              {m.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{m.fullName}</div>
                              <div className="text-xs text-slate-500">{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 sm:px-8 py-4">
                          {role === ROLES.ORG_ADMIN ? (
                            <select
                              value={m.projectRole}
                              onChange={(e) => handleRoleChange(m.id, e.target.value)}
                              className="px-2.5 py-1 bg-slate-50 border border-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                            >
                              <option value="PROJECT_MANAGER">PROJECT MANAGER</option>
                              <option value="DEVELOPER">DEVELOPER</option>
                              <option value="QA">QA</option>
                              <option value="CLIENT">CLIENT</option>
                            </select>
                          ) : (
                            <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                              {m.projectRole?.replaceAll('_', ' ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}