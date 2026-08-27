import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSpecs } from '../hooks/useSpecs.js';
import { projectApi } from '../api/projectApi.js';
import { useAuth, ROLES } from '../context/AuthContext.jsx';
import Can from '../components/Can.jsx';
import StatusPill from '../components/StatusPill.jsx';
import SpecGenerateModal from '../components/SpecGenerateModal.jsx';

export default function SpecList() {
  const { projectId } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { listSpecs, loading, error } = useSpecs();

  const [specs, setSpecs] = useState([]);
  const [project, setProject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const [specRes, projRes] = await Promise.all([
        listSpecs(projectId),
        projectApi.getProject(projectId).catch(() => ({ data: null }))
      ]);
      if (specRes.data) {
        setSpecs(specRes.data);
      }
      if (projRes.data) {
        setProject(projRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [projectId, listSpecs]);

  useEffect(() => {
    load();
  }, [load]);

  // Derived state
  const counts = useMemo(() => {
    return specs.reduce((acc, spec) => {
      acc.ALL++;
      if (spec.status) {
        acc[spec.status] = (acc[spec.status] || 0) + 1;
      }
      return acc;
    }, { ALL: 0, DRAFT: 0, IN_REVIEW: 0, APPROVED: 0 });
  }, [specs]);

  const filteredSpecs = useMemo(() => {
    if (statusFilter === 'ALL') return specs;
    return specs.filter(s => s.status === statusFilter);
  }, [specs, statusFilter]);

  const filterTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'DRAFT', label: 'Draft' },
    { id: 'IN_REVIEW', label: 'In Review' },
    { id: 'APPROVED', label: 'Approved' }
  ];

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">AI Spec Studio</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN]}>
            <button
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
              onClick={() => setIsGenerateModalOpen(true)}
            >
              New Spec
            </button>
          </Can>
        </div>
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        {filterTabs.map(tab => {
          const isActive = statusFilter === tab.id;
          const count = counts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${isActive
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-orange-200/50 text-orange-700' : 'bg-slate-100 text-slate-500'
                }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">Could not load specs: {error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
          <svg className="w-10 h-10 text-slate-300 mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm font-medium text-slate-600">Loading specs...</p>
        </div>
      ) : filteredSpecs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
          <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-slate-600">
            {statusFilter === 'ALL' ? 'No specs found' : `No ${statusFilter.toLowerCase().replace('_', ' ')} specs yet`}
          </p>
          {statusFilter === 'ALL' && (
            <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN]}>
              <button
                className="mt-4 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
                onClick={() => setIsGenerateModalOpen(true)}
              >
                Generate First Spec
              </button>
            </Can>
          )}
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="w-2/5 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Version</th>
                <th className="w-1/5 px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredSpecs.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/projects/${projectId}/specs/${s.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-4 truncate">
                    <span className="text-sm font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {s.title || 'Untitled Spec'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusPill status={s.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-500">v{s.currentVersion || 1}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isGenerateModalOpen && (
        <SpecGenerateModal
          open={isGenerateModalOpen}
          onClose={(shouldReload) => {
            setIsGenerateModalOpen(false);
            if (shouldReload === true) load();
          }}
          projectId={projectId}
          project={project}
        />
      )}
    </div>
  );
}
