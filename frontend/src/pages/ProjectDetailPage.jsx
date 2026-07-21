import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { projectApi } from '../api/projectApi.js'
import { extractErrorMessage } from '../api/client.js'
import HealthBadge from '../components/HealthBadge.jsx'
import Tabs from '../components/Tabs.jsx'
import './workspace.css'

const SAMPLE_PROJECT = {
  name: 'Checkout Revamp',
  description: 'Rebuild the checkout flow to reduce cart abandonment.',
  methodology: 'AGILE',
  health: 'On Track',
  startDate: '2026-05-01',
  endDate: '2026-09-30',
  techStack: ['React', 'Spring Boot', 'PostgreSQL'],
  team: [
    { id: 'm1', name: 'Asha Patel', role: 'PROJECT_MANAGER' },
    { id: 'm2', name: 'Leo Kim', role: 'DEVELOPER' },
  ],
}

const SAMPLE_MILESTONES = [
  { id: 'ms1', name: 'Design freeze', date: '2026-07-10', status: 'Done' },
  { id: 'ms2', name: 'Beta release', date: '2026-07-25', status: 'On Track' },
  { id: 'ms3', name: 'GA launch', date: '2026-08-15', status: 'At Risk' },
]

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [projectRes, milestonesRes] = await Promise.all([
        projectApi.getProject(projectId),
        projectApi.listMilestones(projectId),
      ])

      const projectData = projectRes.data
      const milestonesData = milestonesRes.data

      if (!projectData || typeof projectData !== 'object' || !Array.isArray(milestonesData)) {
        throw new Error('Unexpected response shape from server')
      }

      setProject(projectData)
      setMilestones(milestonesData)
    } catch (err) {
      setError(extractErrorMessage(err))
      
      setProject({ id: projectId, ...SAMPLE_PROJECT })
      setMilestones(SAMPLE_MILESTONES)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  if (loading || !project) {
    return <div className="wk-page"><p className="wk-empty">Loading project…</p></div>
  }

  return (
    <div className="wk-page">
      <Link to="/projects" style={{ fontSize: 12.5, color: 'var(--wk-slate)', textDecoration: 'none' }}>← Back to projects</Link>

      {error && (
        <p className="wk-alert wk-alert-error" style={{ marginTop: 12 }}>
          Live data unavailable — showing sample data instead. ({error})
        </p>
      )}

      <div className="wk-page-header" style={{ marginTop: 12 }}>
        <div>
          <h1 className="wk-page-title">{project.name}</h1>
          <p className="wk-page-subtitle">{project.methodology === 'AGILE' ? 'Agile' : 'Waterfall'} · {project.startDate} → {project.endDate}</p>
        </div>
        <HealthBadge status={project.health} />
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
            {(project.techStack || []).map((tag) => (
              <span key={tag} style={{ background: '#eef2ff', color: 'var(--wk-accent)', fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
                {tag}
              </span>
            ))}
          </div>
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
          {(project.team || []).length === 0 ? (
            <p className="wk-empty">No team members assigned yet.</p>
          ) : (
            <table className="wk-table">
              <thead>
                <tr><th>Name</th><th>Role</th></tr>
              </thead>
              <tbody>
                {project.team.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.role.replaceAll('_', ' ')}</td>
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