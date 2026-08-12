import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { specApi } from '../api/specApi.js'
import { projectApi } from '../api/projectApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Can from '../components/Can.jsx'
import StatusPill from '../components/StatusPill.jsx'

export default function SpecsListPage() {
  const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';
  const { projectId = 'p1' } = useParams()
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const [specs, setSpecs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (projectId && isNaN(Number(projectId))) {
      projectApi.listProjects(user?.orgId)
        .then((res) => {
          const firstProj = res.data?.[0]
          if (firstProj?.id) {
            navigate(`/projects/${firstProj.id}/specs`, { replace: true })
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Specifications</h1>
          {role === ROLES.CLIENT && (
            <p className="text-sm text-slate-500 mt-1">
              Only approved specs are shown to your role.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            className="w-full sm:w-64 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors shadow-sm"
            placeholder="Search specs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN]}>
            <Link to={`/projects/${projectId}/specs/new`} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap">
              + New Spec
            </Link>
          </Can>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">Could not load specs. ({error})</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
          <svg className="w-10 h-10 text-slate-300 mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm font-medium text-slate-600">Loading specs...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
          <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-slate-600">No specs found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust your search or create a new spec.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
          {filtered.map((s) => {
            const storyCount = s.storyCount || 0;
            const title = s.title || 'Untitled Spec';
            const version = s.version || '1.0';
            const updatedAt = s.updatedAt || 'Unknown';
            const displayStatus = formatEnum(s.status);
            return (
              <Link
                key={s.id}
                to={`/projects/${projectId}/specs/${s.id}`}
                className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">{title}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                      v{version}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {storyCount} user stor{storyCount === 1 ? 'y' : 'ies'} · Updated {updatedAt}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:block">
                    <StatusPill status={s.status} fallback={displayStatus} />
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  )
}