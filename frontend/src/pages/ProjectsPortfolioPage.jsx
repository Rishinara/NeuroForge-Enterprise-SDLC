import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { projectApi } from '../api/projectApi.js'
import { orgApi } from '../api/orgApi.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { extractErrorMessage } from '../api/client.js'
import Can from '../components/Can.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import UnassignedOrgNotice from '../components/UnassignedOrgNotice.jsx'
import './workspace.css'

const FILTERS = ['All', 'On Track', 'At Risk', 'Delayed']

export default function ProjectsPortfolioPage() {
  const { user } = useAuth()
  const [orgs, setOrgs] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState('ALL')
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (isSuperAdmin) {
        const orgsRes = await orgApi.listOrganizations()
        const loadedOrgs = Array.isArray(orgsRes.data) ? orgsRes.data : []
        setOrgs(loadedOrgs)

        if (selectedOrgId !== 'ALL') {
          const res = await projectApi.listProjects(selectedOrgId)
          setProjects(Array.isArray(res.data) ? res.data : [])
        } else if (loadedOrgs.length > 0) {
          const projectPromises = loadedOrgs.map((o) =>
            projectApi.listProjects(o.id).catch(() => ({ data: [] }))
          )
          const projectResults = await Promise.all(projectPromises)
          const allProjects = projectResults.flatMap((r) => (Array.isArray(r.data) ? r.data : []))
          setProjects(allProjects)
        } else {
          setProjects([])
        }
      } else {
        const res = await projectApi.listProjects(user?.orgId)
        setProjects(Array.isArray(res.data) ? res.data : [])
      }
    } catch (err) {
      setError(extractErrorMessage(err))
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, selectedOrgId, user?.orgId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return projects
      .filter((p) => {
        if (filter === 'All') return true
        const healthVal = String(p.health || '').toUpperCase()
        if (filter === 'On Track') return healthVal === 'ON_TRACK' || healthVal === 'ON TRACK'
        if (filter === 'At Risk') return healthVal === 'AT_RISK' || healthVal === 'AT RISK'
        if (filter === 'Delayed') return healthVal === 'DELAYED'
        return true
      })
      .filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
  }, [projects, filter, search])

  if (!isSuperAdmin && !user?.orgId) {
    return <UnassignedOrgNotice />
  }

  return (
    <div className="wk-page">
      <div className="wk-page-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="wk-page-title">Projects</h1>
          <p className="wk-page-subtitle">
            {isSuperAdmin
              ? 'Select an organization below to view its dedicated projects.'
              : `${user?.orgName || 'Organization'} projects`}
          </p>
        </div>
        <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN]}>
          <Link to="/projects/new" className="wk-btn wk-btn-primary" style={{ width: 'auto', padding: '10px 18px', textDecoration: 'none' }}>
            New project
          </Link>
        </Can>
      </div>

      {error && (
        <p className="wk-alert wk-alert-error">
          {error}
        </p>
      )}

      {/* Organization Selection Filter for Super Admin */}
      {isSuperAdmin && (
        <div className="wk-card" style={{ marginBottom: 20, padding: 16 }}>
          <label className="wk-label" style={{ marginBottom: 8, display: 'block', fontSize: 13.5, fontWeight: 600, color: '#475569' }}>
            Filter by Organization:
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedOrgId('ALL')}
              className="wk-btn"
              style={{
                width: 'auto',
                padding: '6px 14px',
                fontSize: 12.5,
                borderRadius: 20,
                background: selectedOrgId === 'ALL' ? '#0f172a' : '#f1f5f9',
                color: selectedOrgId === 'ALL' ? '#ffffff' : '#334155',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Organizations ({orgs.length})
            </button>
            {orgs.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => setSelectedOrgId(org.id)}
                className="wk-btn"
                style={{
                  width: 'auto',
                  padding: '6px 14px',
                  fontSize: 12.5,
                  borderRadius: 20,
                  background: selectedOrgId === org.id ? '#4f46e5' : '#f1f5f9',
                  color: selectedOrgId === org.id ? '#ffffff' : '#334155',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🏢 {org.name}
              </button>
            ))}
          </div>
        </div>
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
        <p className="wk-empty">No projects found for the selected organization.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} showTeams={isSuperAdmin} />
          ))}
        </div>
      )}
    </div>
  )
}