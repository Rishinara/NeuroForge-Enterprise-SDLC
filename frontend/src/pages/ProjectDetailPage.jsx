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
import './workspace.css'

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
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
    return <div className="wk-page"><p className="wk-empty">Loading project…</p></div>
  }

  if (!project) {
    return (
      <div className="wk-page">
        <Link to="/projects" style={{ fontSize: 12.5, color: 'var(--wk-slate)', textDecoration: 'none' }}>← Back to projects</Link>
        <p className="wk-alert wk-alert-error" style={{ marginTop: 16 }}>{error || 'Project not found or access denied.'}</p>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the project "${project.name}"?`)) return
    try {
      await projectApi.deleteProject(projectId)
      navigate('/projects')
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div className="wk-page">
      <Link to="/projects" style={{ fontSize: 12.5, color: 'var(--wk-slate)', textDecoration: 'none' }}>← Back to projects</Link>

      {error && (
        <p className="wk-alert wk-alert-error" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}

      <div className="wk-page-header" style={{ marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="wk-page-title">{project.name}</h1>
            <HealthBadge status={project.health} />
          </div>
          <p className="wk-page-subtitle">{project.methodology === 'AGILE' ? 'Agile' : 'Waterfall'} · {project.startDate} → {project.endDate}</p>
        </div>
        
        <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN]}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="wk-btn wk-btn-secondary" onClick={() => setEditOpen(true)}>
              Edit project
            </button>
            <button className="wk-btn" style={{ color: 'var(--wk-error)' }} onClick={handleDelete}>
              Delete
            </button>
          </div>
        </Can>
      </div>

      <EditProjectModal 
        open={editOpen} 
        onClose={() => setEditOpen(false)} 
        project={project} 
        onUpdated={load} 
      />

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="wk-card">
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Description</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: '#334155', marginBottom: 16 }}>{project.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(project.techStack || []).map((tag) => (
                <span key={tag} style={{ background: '#eef2ff', color: 'var(--wk-accent)', fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {progress && (
            <div className="wk-card">
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Project Progress</h3>
              <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>Task Completion</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{progress.completedTasks} / {progress.totalTasks} ({progress.taskCompletionPercentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${progress.taskCompletionPercentage}%`, height: '100%', background: 'var(--wk-accent)', borderRadius: 4 }}></div>
                  </div>
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>Story Points Completion</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{progress.completedStoryPoints} / {progress.totalStoryPoints} ({progress.pointCompletionPercentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${progress.pointCompletionPercentage}%`, height: '100%', background: '#10b981', borderRadius: 4 }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'milestones' && (
        <div className="wk-card">
          {milestones.length === 0 ? (
            <p className="wk-empty">No milestones yet.</p>
          ) : (
            <table className="wk-table">
              <thead>
                <tr><th>Milestone</th><th>Target date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {milestones.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.date}</td>
                    <td><HealthBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'team' && (
        <div className="wk-card">
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Assigned Teams</h3>
          {!project.assignedTeams || project.assignedTeams.length === 0 ? (
            <p className="wk-empty" style={{ marginBottom: 20 }}>No teams assigned.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {project.assignedTeams.map(team => (
                <div 
                  key={team.id} 
                  style={{ 
                    padding: '8px 12px', 
                    background: '#f1f5f9', 
                    borderRadius: 6, 
                    color: '#334155',
                    fontSize: 13,
                    fontWeight: 500
                  }}
                >
                  🏢 {team.name}
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Assigned Members</h3>
          {!project.team || project.team.length === 0 ? (
            <p className="wk-empty">No members assigned to this project yet.</p>
          ) : (
            <table className="wk-table">
              <thead>
                <tr><th>Name</th><th>Role</th></tr>
              </thead>
              <tbody>
                {project.team.map((m) => (
                  <tr key={m.id}>
                    <td>{m.fullName}</td>
                    <td>{m.projectRole?.replaceAll('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}