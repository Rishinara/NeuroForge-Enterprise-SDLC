import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { projectApi } from '../api/projectApi.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { extractErrorMessage } from '../api/client.js'
import Can from '../components/Can.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import './workspace.css'

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'ON_TRACK', label: 'On Track' },
  { key: 'AT_RISK', label: 'At Risk' },
  { key: 'DELAYED', label: 'Delayed' },
]

export default function ProjectsPortfolioPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await projectApi.listOrgProjects(user.orgId)
      if (!Array.isArray(res.data)) throw new Error('Unexpected response shape')
      setProjects(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [user.orgId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return projects
      .filter((p) => filter === 'ALL' || p.healthStatus === filter)
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [projects, filter, search])

  return (
    <div className="wk-page">
      <div className="wk-page-header" style={{ justifyContent: 'flex-end' }}>
        <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
          <Link to="/projects/new" className="wk-btn wk-btn-primary" style={{ textDecoration: 'none' }}>
            New project
          </Link>
        </Can>
      </div>

      {error && (
        <p className="wk-alert wk-alert-error">
          Could not load projects. ({error})
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="wk-btn"
              style={{
                background: filter === f.key ? 'var(--wk-accent)' : '#fff',
                color: filter === f.key ? '#fff' : '#334155',
                border: '1px solid var(--wk-border)',
              }}
            >
              {f.label}
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