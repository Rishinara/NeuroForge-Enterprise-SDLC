import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { projectApi } from '../api/projectApi.js'
import { orgApi } from '../api/orgApi.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { extractErrorMessage } from '../api/client.js'
import Can from '../components/Can.jsx'
import UnassignedOrgNotice from '../components/UnassignedOrgNotice.jsx'

const FILTERS = ['All', 'On Track', 'At Risk', 'Delayed']

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';

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
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-700 mt-1">
            {isSuperAdmin
              ? 'Select an organization below to view its dedicated projects.'
              : `${user?.orgName || 'Organization'} projects`}
          </p>
        </div>
        <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN]}>
          <Link 
            to="/projects/new" 
            className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-150 inline-flex items-center justify-center"
          >
            New project
          </Link>
        </Can>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Organization Selection Filter for Super Admin */}
      {isSuperAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <label className="text-sm font-semibold text-slate-800 mb-3 block">
            Filter by Organization
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedOrgId('ALL')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedOrgId === 'ALL' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Organizations ({orgs.length})
            </button>
            {orgs.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => setSelectedOrgId(org.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedOrgId === org.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🏢 {org.name || 'Unknown'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search - Right aligned gutter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
          <svg className="animate-spin w-8 h-8 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm font-medium text-slate-600">Loading projects</p>
          <p className="text-xs text-slate-400 mt-1">Please wait while we fetch the portfolio...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
          <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm font-medium text-slate-600">No projects found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => {
            const progress = p.progressPercent ?? 0;
            const methodology = formatEnum(p.methodology);
            const healthStatus = formatEnum(p.health);
            
            // Map health status to colors
            let statusColor = "bg-slate-100 text-slate-700";
            if (p.health === 'ON_TRACK') statusColor = "bg-emerald-100 text-emerald-700";
            if (p.health === 'AT_RISK') statusColor = "bg-amber-100 text-amber-700";
            if (p.health === 'DELAYED') statusColor = "bg-red-100 text-red-700";

            return (
              <Link 
                key={p.id}
                to={`/projects/${p.id}`} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {p.name || 'Untitled Project'}
                  </h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${statusColor}`}>
                    {healthStatus}
                  </span>
                </div>

                <div className="flex items-center text-xs font-medium text-slate-500 mb-6 gap-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    {methodology}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    {p.teamSize ?? 0} members
                  </span>
                </div>

                {p.techStack?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {p.techStack.slice(0, 4).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[11px] font-medium border border-slate-100">
                        {tag}
                      </span>
                    ))}
                    {p.techStack.length > 4 && (
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[11px] font-medium border border-slate-100">
                        +{p.techStack.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {isSuperAdmin && p.assignedTeams?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {p.assignedTeams.map((t) => (
                      <span key={t.id} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                        Team: {t.name || 'Unknown'}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-medium text-slate-500">Progress</span>
                    <span className="text-sm font-semibold text-slate-900">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  )
}