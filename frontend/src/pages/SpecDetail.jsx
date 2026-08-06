import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSpecs } from '../hooks/useSpecs.js';
import { useAuth, ROLES } from '../context/AuthContext.jsx';
import Can from '../components/Can.jsx';
import StatusPill from '../components/StatusPill.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import './specs.css';

const formatStatus = (status) => status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';

export default function SpecDetail() {
  const { projectId, specId } = useParams();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { getSpec, editSpecVersion, submitForReview, approveSpec, requestChanges, getSpecVersion, loading, error } = useSpecs();

  const [spec, setSpec] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [activeVersionData, setActiveVersionData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const [reviewNoteInput, setReviewNoteInput] = useState('');

  const load = useCallback(async () => {
    if (!specId) return;
    const res = await getSpec(specId);
    if (res.data) {
      setSpec(res.data);
      if (res.data.versions && res.data.versions.length > 0) {
        setSelectedVersion(res.data.version);
        setActiveVersionData(res.data);
        setEditData(JSON.parse(JSON.stringify(res.data)));
      }
    }
  }, [specId, getSpec]);

  useEffect(() => {
    load();
  }, [load]);

  const loadVersion = async (vNum) => {
    setSelectedVersion(vNum);
    setIsEditing(false);
    
    const res = await getSpecVersion(specId, vNum);
    if (res.data) {
      setActiveVersionData(res.data);
      setEditData(JSON.parse(JSON.stringify(res.data)));
    }
  };

  const handleSaveEdit = async () => {
    setActionError('');
    setActionLoading(true);
    const res = await editSpecVersion(specId, activeVersionData.version, editData);
    setActionLoading(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      setIsEditing(false);
      load();
    }
  };

  const handleSubmitReview = async () => {
    setActionError('');
    setActionLoading(true);
    const res = await submitForReview(specId);
    setActionLoading(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      load();
    }
  };

  const handleApprove = async () => {
    setActionError('');
    setActionLoading(true);
    const res = await approveSpec(specId);
    setActionLoading(false);
    setShowApproveConfirm(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      load();
    }
  };

  const handleRequestChanges = async () => {
    if (!reviewNoteInput.trim()) return;
    setActionError('');
    setActionLoading(true);
    const res = await requestChanges(specId, reviewNoteInput);
    setActionLoading(false);
    setShowRequestChanges(false);
    setReviewNoteInput('');
    if (res.error) {
      setActionError(res.error);
    } else {
      load();
    }
  };

  const handleNewVersion = async () => {
    setActionError('');
    setActionLoading(true);
    const res = await editSpecVersion(specId, activeVersionData.version, activeVersionData);
    setActionLoading(false);
    if (res.error) {
      setActionError(res.error);
    } else {
      await load();
      setIsEditing(true);
    }
  };

  const updateStory = (idx, field, val) => {
    const newData = { ...editData };
    newData.userStories[idx][field] = val;
    setEditData(newData);
  };

  const updateCriteria = (storyIdx, criteriaIdx, val) => {
    const newData = { ...editData };
    newData.acceptanceCriteria[storyIdx].criteria[criteriaIdx] = val;
    setEditData(newData);
  };

  const updateList = (field, idx, val) => {
    const newData = { ...editData };
    newData[field][idx] = val;
    setEditData(newData);
  };

  if (loading && !spec) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6 animate-pulse">
        <div className="h-4 w-24 bg-slate-200 rounded mb-8"></div>
        <div className="h-10 w-3/4 bg-slate-200 rounded"></div>
        <div className="h-6 w-1/3 bg-slate-200 rounded mt-4"></div>
        <div className="h-32 w-full bg-slate-100 rounded mt-12"></div>
        <div className="h-32 w-full bg-slate-100 rounded mt-6"></div>
      </div>
    );
  }

  if (error && !spec) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Link to={`/projects/${projectId}/specs`} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm w-fit">
          ← Back to specs
        </Link>
        <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-xl border border-dashed border-red-200 text-center">
          <svg className="w-10 h-10 text-red-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!spec || !activeVersionData) return null;

  const isImmutable = activeVersionData.isImmutable || activeVersionData.status === 'APPROVED' || activeVersionData.status === 'SUPERSEDED';
  const isLatestVersion = spec.version === activeVersionData.version;
  const canEdit = !isImmutable && isLatestVersion && role === ROLES.PROJECT_MANAGER;
  const isApprover = role === ROLES.PROJECT_MANAGER || role === ROLES.ORG_ADMIN;

  const sortedVersions = [...spec.versions].sort((a,b) => b.version - a.version);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 mb-24">
      {/* Header Band */}
      <div className="space-y-5 relative">
        <Link to={`/projects/${projectId}/specs`} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm w-fit">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Specs
        </Link>

        {actionError && (
          <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {actionError}
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{spec.title}</h1>
              <StatusPill status={formatStatus(activeVersionData.status)} />
            </div>

            {/* Version Tabs */}
            {sortedVersions.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {sortedVersions.map(v => {
                  const isActive = selectedVersion === v.version;
                  const isSuperseded = v.status === 'SUPERSEDED';
                  return (
                    <button
                      key={v.version}
                      onClick={() => !isEditing && loadVersion(v.version)}
                      disabled={isEditing}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                        isActive 
                          ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                          : isSuperseded
                            ? 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                      } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      v{v.version}
                      {isSuperseded && !isActive && <span className="font-normal opacity-75">(superseded)</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Cluster (Top Right) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {canEdit && !isEditing && (
              <button 
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2" 
                onClick={() => setIsEditing(true)}
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Specification
              </button>
            )}

            {!isEditing && isLatestVersion && (
              <>
                {role === ROLES.PROJECT_MANAGER && activeVersionData.status === 'DRAFT' && (
                  <button className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg shadow-sm transition-all" onClick={handleSubmitReview} disabled={actionLoading}>
                    Submit for Review
                  </button>
                )}
                {isApprover && activeVersionData.status === 'IN_REVIEW' && (
                  <>
                    <button className="px-5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2" onClick={() => setShowRequestChanges(true)} disabled={actionLoading}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Request Changes
                    </button>
                    <button className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2" onClick={() => setShowApproveConfirm(true)} disabled={actionLoading}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve Spec
                    </button>
                  </>
                )}
                {role === ROLES.PROJECT_MANAGER && activeVersionData.status === 'APPROVED' && (
                  <button className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-all" onClick={handleNewVersion} disabled={actionLoading}>
                    Create New Version
                  </button>
                )}
              </>
            )}

            {isEditing && (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <button 
                  className="px-4 py-1.5 bg-transparent hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-lg transition-colors" 
                  onClick={() => { setIsEditing(false); setEditData(JSON.parse(JSON.stringify(activeVersionData))); }} 
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  className="px-5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 min-w-[120px] justify-center" 
                  onClick={handleSaveEdit} 
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white/70" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lock State Banner */}
        {isImmutable && (
          <div className="flex items-center gap-2 p-3 bg-green-50/50 border border-green-200 rounded-lg text-sm text-green-800 mt-4">
            <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-medium">
              {activeVersionData.approvedAt 
                ? `Approved by ${activeVersionData.approvedBy || 'Admin'} on ${new Date(activeVersionData.approvedAt).toLocaleDateString()}` 
                : 'This version is locked and read-only.'}
            </span>
          </div>
        )}

        {/* Review Note Banner */}
        {activeVersionData.status === 'DRAFT' && activeVersionData.reviewNote && (
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-900 mt-4 shadow-sm">
            <svg className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <div className="flex flex-col gap-1 w-full">
              <span className="font-bold text-orange-800">Changes Requested</span>
              <p className="whitespace-pre-wrap leading-relaxed opacity-90">{activeVersionData.reviewNote}</p>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-slate-200 w-full my-8"></div>

      {/* Document Content - Single Column */}
      <div className="space-y-16">
        
        {/* User Stories & Acceptance Criteria */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">User Stories & Criteria</h2>
          </div>

          <div className="space-y-6">
            {(!isEditing && (!activeVersionData.userStories || activeVersionData.userStories.length === 0)) ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                <svg className="w-8 h-8 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-sm font-medium text-slate-600 mb-1">No user stories yet</p>
                {canEdit && (
                  <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                    Add manually
                  </button>
                )}
              </div>
            ) : (
              (isEditing ? editData.userStories : activeVersionData.userStories)?.map((story, sIdx) => {
                const criteriaObj = (isEditing ? editData.acceptanceCriteria : activeVersionData.acceptanceCriteria)?.find(ac => ac.storyId === story.id) || { criteria: [] };
                
                return (
                  <div key={story.id || sIdx} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    {/* Story Header */}
                    <div className="p-5 bg-slate-50/50 border-b border-slate-200">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 w-16">As a</span>
                            <input className="wk-input flex-1 font-medium bg-white" value={story.asA || ''} onChange={e => updateStory(sIdx, 'asA', e.target.value)} />
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 w-16">I want</span>
                            <input className="wk-input flex-1 font-medium bg-white" value={story.iWant || ''} onChange={e => updateStory(sIdx, 'iWant', e.target.value)} />
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2 w-16">So that</span>
                            <input className="wk-input flex-1 font-medium bg-white" value={story.soThat || ''} onChange={e => updateStory(sIdx, 'soThat', e.target.value)} />
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-800 text-lg font-medium leading-relaxed">
                          <span className="text-slate-400 font-normal mr-1">As a</span>
                          <span className="font-semibold text-slate-900 border-b border-slate-300">{story.asA}</span>, 
                          <span className="text-slate-400 font-normal mx-1">I want</span>
                          <span className="font-semibold text-slate-900 border-b border-slate-300">{story.iWant}</span>, 
                          <span className="text-slate-400 font-normal mx-1">so that</span>
                          <span className="font-semibold text-slate-900 border-b border-slate-300">{story.soThat}</span>.
                        </p>
                      )}
                    </div>

                    {/* Acceptance Criteria */}
                    <div className="p-5 bg-white">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Acceptance Criteria
                      </p>
                      <ul className="space-y-3">
                        {criteriaObj.criteria.map((c, cIdx) => (
                          <li key={cIdx} className="flex gap-3 text-slate-700">
                            <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-300"></div>
                            {isEditing ? (
                              <input 
                                className="wk-input flex-1 py-1.5 text-sm" 
                                value={c} 
                                onChange={e => {
                                  const acIdx = editData.acceptanceCriteria.findIndex(ac => ac.storyId === story.id);
                                  if(acIdx >= 0) updateCriteria(acIdx, cIdx, e.target.value);
                                }} 
                              />
                            ) : (
                              <span className="text-[15px] leading-relaxed">{c}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Functional Requirements */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="p-1.5 bg-orange-50 text-orange-600 rounded-md">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Functional Requirements</h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            {(!isEditing && (!activeVersionData.functionalRequirements || activeVersionData.functionalRequirements.length === 0)) ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <svg className="w-6 h-6 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-sm font-medium text-slate-500 mb-1">No functional requirements yet</p>
                {canEdit && (
                  <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    Add manually
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-3">
                {(isEditing ? editData.functionalRequirements : activeVersionData.functionalRequirements)?.map((req, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 text-slate-300">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    {isEditing ? (
                      <input className="wk-input flex-1 py-1.5 text-sm" value={req} onChange={e => updateList('functionalRequirements', rIdx, e.target.value)} />
                    ) : (
                      <span className="text-slate-700 text-[15px] pt-0.5">{req}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Non-Functional Requirements */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Non-Functional Requirements</h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            {(!isEditing && (!activeVersionData.nonFunctionalRequirements || activeVersionData.nonFunctionalRequirements.length === 0)) ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <svg className="w-6 h-6 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <p className="text-sm font-medium text-slate-500 mb-1">No non-functional requirements yet</p>
                {canEdit && (
                  <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                    Add manually
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-3">
                {(isEditing ? editData.nonFunctionalRequirements : activeVersionData.nonFunctionalRequirements)?.map((req, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 text-slate-300">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    {isEditing ? (
                      <input className="wk-input flex-1 py-1.5 text-sm" value={req} onChange={e => updateList('nonFunctionalRequirements', rIdx, e.target.value)} />
                    ) : (
                      <span className="text-slate-700 text-[15px] pt-0.5">{req}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog 
        open={showApproveConfirm}
        title="Approve Specification"
        message="Are you sure you want to approve this specification? This will lock the current version, making it immutable. Any future edits will require creating a new version."
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApprove}
        confirmText="Yes, Approve"
      />

      {showRequestChanges && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Request Changes</h3>
              <button onClick={() => setShowRequestChanges(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">Please provide detailed notes on what needs to be changed before this specification can be approved.</p>
              <textarea 
                className="wk-textarea min-h-[120px] w-full"
                placeholder="E.g., The acceptance criteria for the login story is missing edge cases for locked accounts..."
                value={reviewNoteInput}
                onChange={e => setReviewNoteInput(e.target.value)}
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button className="wk-btn wk-btn-secondary" onClick={() => setShowRequestChanges(false)} disabled={actionLoading}>Cancel</button>
              <button 
                className="wk-btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50" 
                onClick={handleRequestChanges}
                disabled={!reviewNoteInput.trim() || actionLoading}
              >
                {actionLoading ? 'Submitting...' : 'Request Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
