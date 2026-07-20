import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { projectApi } from '../api/projectApi.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { extractErrorMessage } from '../api/client.js'
import Can from '../components/Can.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import './workspace.css'

const FILTERS = ['All', 'On Track', 'At Risk', 'Delayed']

const SAMPLE_PROJECTS = [
  { id: 'p1', name: 'Checkout Revamp', health: 'On Track', methodology: 'Agile', teamSize: 6, techStack: ['React', 'Spring Boot', 'PostgreSQL'], progressPercent: 72 },
  { id: 'p2', name: 'Mobile App v3', health: 'At Risk', methodology: 'Agile', teamSize: 5, techStack: ['React Native', 'Node'], progressPercent: 45 },
  { id: 'p3', name: 'Data Platform', health: 'Delayed', methodology: 'Waterfall', teamSize: 8, techStack: ['Python', 'Kafka', 'Snowflake'], progressPercent: 28 },
  { id: 'p4', name: 'Internal Tools', health: 'On Track', methodology: 'Agile', teamSize: 3, techStack: ['React', 'Express'], progressPercent: 88 },
]

export default function ProjectsPortfolioPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await projectApi.listProjects(user.orgId)
      if (!Array.isArray(res.data)) {
        throw new Error('Unexpected response shape from server')
      }
      setProjects(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
      // Sample data so the page stays demoable without a live backend
      setProjects(SAMPLE_PROJECTS)
    } finally {
      setLoading(false)
    }
  }, [user.orgId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return projects
      .filter((p) => filter === 'All' || p.health === filter)
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [projects, filter, search])

  return (
    <div className="wk-page">
      <div className="wk-page-header" style={{ justifyContent: 'flex-end' }}>
        <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
          <Link to="/projects/new" className="wk-btn wk-btn-primary" style={{ width: 'auto', padding: '10px 18px', textDecoration: 'none' }}>
            New project
          </Link>
        </Can>
      </div>

      {error && (
        <p className="wk-alert wk-alert-error">
          Live data unavailable — showing sample data instead. ({error})
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="wk-btn"
              style={{
                width: 'auto',
                padding: '7px 14px',
                fontSize: 12.5,
                background: filter === f ? 'var(--wk-accent)' : '#fff',
                color: filter === f ? '#fff' : '#334155',
                border: '1px solid #e2e4ec',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          className="wk-input"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
      </div>

      {loading ? (
        <p className="wk-empty">Loading projects…</p>
      ) : filtered.length === 0 ? (
        <p className="wk-empty">No projects match this filter.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  )
}