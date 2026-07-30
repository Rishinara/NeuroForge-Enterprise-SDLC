import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectApi } from '../api/projectApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Can from '../components/Can.jsx'
import HealthBadge from '../components/HealthBadge.jsx'
import Tabs from '../components/Tabs.jsx'
import './workspace.css'

const CAN_TOGGLE_MILESTONE = [ROLES.PROJECT_MANAGER, ROLES.DEVELOPER, ROLES.SUPER_ADMIN]

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [togglingId, setTogglingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await projectApi.getProject(projectId)
      if (!res.data || typeof res.data !== 'object') throw new Error('Unexpected response shape')
      setProject(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
      setProject(null)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  async function handleToggleMilestone(milestoneId, currentlyCompleted) {
    setTogglingId(milestoneId)
    try {
      const res = await projectApi.toggleMilestone(projectId, milestoneId, !currentlyCompleted)
      setProject(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setTogglingId(null)
    }
  }

  if (loading) {
    return <div className="wk-page"><p className="wk-empty">Loading project…</p></div>
  }

  if (!project) {
    return (
      <div className="wk-page">
        <Link to="/projects" style={{ fontSize: 12.5, color: 'var(--wk-slate)', textDecoration: 'none' }}>← Back to projects</Link>
        <p className="wk-alert wk-alert-error" style={{ marginTop: 12 }}>
          {error || 'This project could not be found.'}
        </p>
      </div>
    )
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
        <div>
          <h1 className="wk-page-title">{project.name}</h1>
          <p className="wk-page-subtitle">
            {project.methodology === 'AGILE' ? 'Agile' : 'Waterfall'} · {project.startDate} → {project.endDate}
            {project.teamName && <> · Team: {project.teamName}</>}
          </p>
        </div>
        <HealthBadge status={project.healthStatus} />
      </div>

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
        <div className="wk-card">
          <p style={{ fontSize: 13.5, lineHeight: 1.7, color: '#334155', marginBottom: 16 }}>{project.description}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(project.techStackTags || []).map((tag) => (
              <span key={tag} style={{ background: 'var(--wk-accent-soft)', color: 'var(--wk-accent)', fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === 'milestones' && (
        <div className="wk-card">
          {(project.milestones || []).length === 0 ? (
            <p className="wk-empty">No milestones yet.</p>
          ) : (
            <table className="wk-table">
              <thead>
                <tr><th>Milestone</th><th>Due date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {project.milestones.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.dueDate}</td>
                    <td>
                      <Can
                        roles={CAN_TOGGLE_MILESTONE}
                        fallback={
                          <span style={{ fontSize: 11, fontWeight: 600, color: m.completed ? '#166534' : '#92400e' }}>
                            {m.completed ? 'Completed' : 'Pending'}
                          </span>
                        }
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={m.completed}
                            disabled={togglingId === m.id}
                            onChange={() => handleToggleMilestone(m.id, m.completed)}
                          />
                          {m.completed ? 'Completed' : 'Pending'}
                        </label>
                      </Can>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'team' && (
        <div className="wk-card">
          {(project.members || []).length === 0 ? (
            <p className="wk-empty">No members on this project's team yet.</p>
          ) : (
            <table className="wk-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th></tr>
              </thead>
              <tbody>
                {project.members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.fullName}</td>
                    <td>{m.email}</td>
                    <td>{m.role?.replaceAll('_', ' ')}</td>
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