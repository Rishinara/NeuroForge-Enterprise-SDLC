import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { specApi } from '../api/specApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Can from '../components/Can.jsx'
import StatusPill from '../components/StatusPill.jsx'
import './specs.css'

export default function SpecsListPage() {
  const { projectId = 'p1' } = useParams()
  const { role } = useAuth()
  const [specs, setSpecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await specApi.listSpecs(projectId)
      if (!Array.isArray(res.data)) throw new Error('Unexpected response shape')
      setSpecs(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
      setSpecs([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () => specs.filter((s) => s.title.toLowerCase().includes(search.toLowerCase())),
    [specs, search]
  )

  return (
    <div className="wk-page">
      <div className="wk-page-header" style={{ justifyContent: 'space-between' }}>
        <input
          className="wk-input"
          placeholder="Search specs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 240 }}
        />
        <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
          <Link to={`/projects/${projectId}/specs/new`} className="wk-btn wk-btn-primary" style={{ textDecoration: 'none' }}>
            + New spec
          </Link>
        </Can>
      </div>

      {error && (
        <p className="wk-alert wk-alert-error">
          Could not load specs. ({error})
        </p>
      )}

      <div className="wk-card" style={{ padding: 0 }}>
        {loading ? (
          <p className="wk-empty">Loading specs…</p>
        ) : filtered.length === 0 ? (
          <p className="wk-empty">No specs match your search.</p>
        ) : (
          <div className="sp-list">
            {filtered.map((s) => (
              <Link key={s.id} to={`/projects/${projectId}/specs/${s.id}`} className="sp-row">
                <div className="sp-row-main">
                  <span className="sp-row-title">{s.title}</span>
                  <span className="sp-row-meta">{s.storyCount} user stor{s.storyCount === 1 ? 'y' : 'ies'} · updated {s.updatedAt}</span>
                </div>
                <span className="sp-version">v{s.version}</span>
                <StatusPill status={s.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {role === ROLES.CLIENT && (
        <p className="wk-page-subtitle" style={{ marginTop: 4 }}>
          Only approved specs are shown to your role.
        </p>
      )}
    </div>
  )
}