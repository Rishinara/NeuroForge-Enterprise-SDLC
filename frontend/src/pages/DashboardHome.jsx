import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { IconProjects, IconCheckCircle, IconAlertTriangle, IconClock, IconArrowRight } from '../components/icons.jsx'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { projectApi } from '../api/projectApi.js'
import { extractErrorMessage } from '../api/client.js'
import Can from '../components/Can.jsx'
import HealthBadge from '../components/HealthBadge.jsx'
import './dashboard-home.css'

const SAMPLE_PROJECTS = [
  { id: 'p1', name: 'Checkout Revamp', health: 'On Track', methodology: 'Agile', progressPercent: 72 },
  { id: 'p2', name: 'Mobile App v3', health: 'At Risk', methodology: 'Agile', progressPercent: 45 },
  { id: 'p3', name: 'Data Platform', health: 'Delayed', methodology: 'Waterfall', progressPercent: 28 },
  { id: 'p4', name: 'Internal Tools', health: 'On Track', methodology: 'Agile', progressPercent: 88 },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardHome() {
  const { user, role } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await projectApi.listProjects(user.orgId)
      if (!Array.isArray(res.data)) throw new Error('Unexpected response shape')
      setProjects(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
      setProjects(SAMPLE_PROJECTS)
    } finally {
      setLoading(false)
    }
  }, [user.orgId])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    const total = projects.length
    const onTrack = projects.filter((p) => p.health === 'On Track').length
    const atRisk = projects.filter((p) => p.health === 'At Risk').length
    const delayed = projects.filter((p) => p.health === 'Delayed').length
    return { total, onTrack, atRisk, delayed }
  }, [projects])

  return (
    <div className="dh-page">
      {/* Hero */}
      <div className="dh-hero">
        <div className="dh-hero-content">
          <p className="dh-hero-eyebrow">{greeting()}</p>
          <h2 className="dh-hero-title">{user?.fullName?.split(' ')[0]}, here's where things stand.</h2>
          <p className="dh-hero-copy">{user?.orgName} · {stats.total} active project{stats.total === 1 ? '' : 's'}</p>
        </div>
        <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
          <Link to="/projects/new" className="dh-hero-cta">
            New project <IconArrowRight size={14} />
          </Link>
        </Can>
      </div>

      {error && (
        <p className="wk-alert wk-alert-error" style={{ marginBottom: 20 }}>
          Live data unavailable — showing sample data instead. ({error})
        </p>
      )}

      <div className="dh-stats">
        <div className="dh-stat-card">
          <div className="dh-stat-icon dh-icon-neutral"><IconProjects size={17} /></div>
          <div>
            <div className="dh-stat-value">{stats.total}</div>
            <div className="dh-stat-label">Total projects</div>
          </div>
        </div>
        <div className="dh-stat-card">
          <div className="dh-stat-icon dh-icon-good"><IconCheckCircle size={17} /></div>
          <div>
            <div className="dh-stat-value">{stats.onTrack}</div>
            <div className="dh-stat-label">On track</div>
          </div>
        </div>
        <div className="dh-stat-card">
          <div className="dh-stat-icon dh-icon-warn"><IconClock size={17} /></div>
          <div>
            <div className="dh-stat-value">{stats.atRisk}</div>
            <div className="dh-stat-label">At risk</div>
          </div>
        </div>
        <div className="dh-stat-card">
          <div className="dh-stat-icon dh-icon-bad"><IconAlertTriangle size={17} /></div>
          <div>
            <div className="dh-stat-value">{stats.delayed}</div>
            <div className="dh-stat-label">Delayed</div>
          </div>
        </div>
      </div>

      
      <div className="dh-card">
        <div className="dh-card-header">
          <h3 className="dh-card-title">
            {role === ROLES.CLIENT ? 'Project progress' : 'Your projects'}
          </h3>
          <Link to="/projects" className="dh-view-all">
            View all <IconArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <p className="dh-empty">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="dh-empty">No projects yet.</p>
        ) : (
          <div className="dh-project-list">
            {projects.slice(0, 5).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="dh-project-row">
                <div className="dh-project-main">
                  <span className="dh-project-name">{p.name}</span>
                  <span className="dh-project-meta">{p.methodology}</span>
                </div>
                <div className="dh-project-progress-track">
                  <div className="dh-project-progress-fill" style={{ width: `${p.progressPercent ?? 0}%` }} />
                </div>
                <span className="dh-project-percent">{p.progressPercent ?? 0}%</span>
                <HealthBadge status={p.health} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}