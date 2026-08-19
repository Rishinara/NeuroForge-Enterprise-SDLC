import { useState, useEffect, useCallback } from 'react';
import { useAuth, ROLES } from '../context/AuthContext.jsx';
import { api, extractErrorMessage } from '../api/client.js';
import { approvalApi } from '../api/approvalApi.js';
import { deliverableApi } from '../api/deliverableApi.js';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Flag,
  Sparkles,
  ShieldCheck,
  Plus,
  ArrowRight,
  ExternalLink,
  Search,
  Filter
} from 'lucide-react';

const STATUS_COLORS = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CHANGES_REQUESTED: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200'
};

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown';

export default function ClientDashboard({ project }) {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('approvals');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [deliverables, setDeliverables] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Action Modal State for Deliverable or Approval
  const [actionModal, setActionModal] = useState({ open: false, item: null, type: 'DELIVERABLE', actionType: '' });
  const [actionForm, setActionForm] = useState({ comments: '', attachedFileUrl: '' });
  const [submittingAction, setSubmittingAction] = useState(false);

  // Request Approval Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestModalError, setRequestModalError] = useState('');
  const [requestForm, setRequestForm] = useState({
    title: '',
    entityType: '',
    entityId: '',
    comments: '',
    attachmentUrl: ''
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState({ open: false, approvalId: null, projectId: null });
  const [deletingRequest, setDeletingRequest] = useState(false);

  const handleDeleteApproval = async () => {
    if (!deleteModal.approvalId || !deleteModal.projectId) return;
    setDeletingRequest(true);
    try {
      await approvalApi.deleteApproval(deleteModal.projectId, deleteModal.approvalId);
      setDeleteModal({ open: false, approvalId: null, projectId: null });
      await loadData();
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setDeletingRequest(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    setError('');
    try {
      const [delRes, appRes, logRes, milRes, specRes] = await Promise.all([
        deliverableApi.getDeliverables(project.id).catch(() => ({ data: [] })),
        approvalApi.getApprovals(project.id).catch(() => ({ data: [] })),
        api.get(`/projects/${project.id}/audit-logs`).catch(() => ({ data: [] })),
        api.get(`/projects/${project.id}/milestones`).catch(() => ({ data: [] })),
        api.get(`/projects/${project.id}/specs`).catch(() => ({ data: [] }))
      ]);
      setDeliverables(Array.isArray(delRes.data) ? delRes.data : []);
      setApprovals(Array.isArray(appRes.data) ? appRes.data : []);
      setAuditLogs(Array.isArray(logRes.data) ? logRes.data : []);
      setMilestones(Array.isArray(milRes.data) ? milRes.data : []);
      setSpecs(Array.isArray(specRes.data) ? specRes.data : []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Client Review Action on Deliverables or Approval Requests
  const handleClientAction = async (e) => {
    e.preventDefault();
    if (!actionModal.item) return;
    setSubmittingAction(true);
    try {
      if (actionModal.type === 'DELIVERABLE') {
        await deliverableApi.clientAction(project.id, actionModal.item.id, {
          action: actionModal.actionType,
          comments: actionForm.comments,
          attachedFileUrl: actionForm.attachedFileUrl
        });
      } else {
        await approvalApi.actionApproval(project.id, actionModal.item.id, {
          status: actionModal.actionType,
          comments: actionForm.comments,
          attachmentUrl: actionForm.attachedFileUrl
        });
      }
      setActionModal({ open: false, item: null, type: 'DELIVERABLE', actionType: '' });
      setActionForm({ comments: '', attachedFileUrl: '' });
      await loadData();
    } catch (err) {
      alert(extractErrorMessage(err));
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Submitting a New Approval Request
  const handleCreateApprovalRequest = async (e) => {
    e.preventDefault();
    setRequestModalError('');

    const trimmedTitle = requestForm.title ? requestForm.title.trim() : '';
    if (!trimmedTitle) {
      setRequestModalError('Request Title is required.');
      return;
    }
    if (trimmedTitle.length < 3) {
      setRequestModalError('Request Title must be at least 3 characters long.');
      return;
    }

    if (!requestForm.entityType) {
      setRequestModalError('Please select a Scope / Category for this request.');
      return;
    }

    if (!requestForm.entityId) {
      if (!milestones || milestones.length === 0) {
        setRequestModalError('No milestones exist for this project. Please create a milestone first before requesting approval.');
      } else {
        setRequestModalError('Please select a Milestone for this request.');
      }
      return;
    }

    if (requestForm.attachmentUrl && requestForm.attachmentUrl.trim()) {
      const url = requestForm.attachmentUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setRequestModalError('Attachment URL must start with http:// or https://');
        return;
      }
    }

    setSubmittingRequest(true);
    try {
      await approvalApi.createApproval(project.id, {
        title: trimmedTitle,
        entityType: requestForm.entityType,
        entityId: requestForm.entityId ? Number(requestForm.entityId) : null,
        comments: requestForm.comments ? requestForm.comments.trim() : '',
        attachmentUrl: requestForm.attachmentUrl ? requestForm.attachmentUrl.trim() : '',
        projectId: project.id
      });
      setRequestModalOpen(false);
      setRequestForm({
        title: '',
        entityType: '',
        entityId: '',
        comments: '',
        attachmentUrl: ''
      });
      setRequestModalError('');
      await loadData();
    } catch (err) {
      setRequestModalError(extractErrorMessage(err));
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (!project) return null;

  // Calculate Metrics
  const pendingDeliverables = deliverables.filter(d => d.status === 'SUBMITTED');
  const pendingApprovals = approvals.filter(a => a.status === 'PENDING');
  const approvedDeliverables = deliverables.filter(d => d.status === 'APPROVED');
  const approvedApprovals = approvals.filter(a => a.status === 'APPROVED');
  const totalPendingAction = pendingDeliverables.length + pendingApprovals.length;
  const completedMilestonesCount = milestones.filter(m => m.status === 'ACHIEVED').length;

  // Split approvals into items requiring approval vs client's own pending requests
  const requiringApprovalApps = approvals.filter(a => a.status === 'PENDING' && a.requestedByRole !== 'CLIENT');
  const pendingClientRequests = approvals.filter(a => a.status === 'PENDING' && a.requestedByRole === 'CLIENT');

  // Filter Deliverables and Approvals for UI
  const filteredDeliverables = deliverables.filter(d => {
    if (d.status === 'DRAFT' && role === ROLES.CLIENT) return false;
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING') return d.status === 'SUBMITTED';
    return d.status === filterStatus;
  });

  const filteredApprovals = approvals.filter(a => {
    if (filterStatus === 'ALL') return true;
    return a.status === filterStatus;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.userName && log.userName.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.entityType && log.entityType.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xl">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalPendingAction}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Action</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{approvedDeliverables.length + approvedApprovals.length}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Items</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
            <Flag size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{completedMilestonesCount} / {milestones.length}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Milestones Achieved</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{specs.length}</div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Specifications</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide">
          <button
            className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'approvals'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            onClick={() => setActiveTab('approvals')}
          >
            <ShieldCheck size={18} />
            Approval Center
            {totalPendingAction > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                {totalPendingAction}
              </span>
            )}
          </button>

          <button
            className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'progress'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            onClick={() => setActiveTab('progress')}
          >
            <Flag size={18} />
            Progress & Milestones
          </button>

          <button
            className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'specs'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            onClick={() => setActiveTab('specs')}
          >
            <Sparkles size={18} />
            AI Specs Review
          </button>

          <button
            className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'audit'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            onClick={() => setActiveTab('audit')}
          >
            <FileText size={18} />
            Audit Trail
          </button>
        </div>

        {/* Request Approval Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRequestModalOpen(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Request
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading client dashboard data...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* TAB 1: APPROVAL CENTER */}
      {activeTab === 'approvals' && !loading && (
        <div className="space-y-6">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
                <Filter size={14} /> Filter:
              </span>
              {[
                { key: 'ALL', label: 'All Items' },
                { key: 'PENDING', label: 'Action Required' },
                { key: 'APPROVED', label: 'Approved' },
                { key: 'CHANGES_REQUESTED', label: 'Revision Needed' },
                { key: 'REJECTED', label: 'Declined' }
              ].map((pill) => (
                <button
                  key={pill.key}
                  onClick={() => setFilterStatus(pill.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === pill.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                    }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-800">{filteredDeliverables.length + filteredApprovals.length}</span> item(s)
            </div>
          </div>

          {/* Items Requiring Your Approval Container */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="text-amber-500" size={18} />
              Items Requiring Your Approval
            </h3>
            {filteredDeliverables.length === 0 && requiringApprovalApps.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-800">You're All Caught Up!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No deliverables or requests are currently waiting for your review. You will be notified when new items are submitted.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Deliverables Cards */}
                {filteredDeliverables.map((d) => (
                  <div
                    key={`del-${d.id}`}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:border-orange-200 transition-all group animate-fadeIn"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">
                            Deliverable
                          </span>
                          <h4 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                            {d.title}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[d.status] || STATUS_COLORS.DRAFT}`}>
                          {formatEnum(d.status)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-3 mb-4">{d.description || 'No description provided.'}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div><span className="font-medium text-slate-700">Version:</span> v{d.version}</div>
                        {d.milestoneId && (
                          <div><span className="font-medium text-slate-700">Milestone:</span> {milestones.find(m => m.id === d.milestoneId)?.title || `Milestone #${d.milestoneId}`}</div>
                        )}
                        {d.authorName && (
                          <div><span className="font-medium text-slate-700">Author:</span> {d.authorName}</div>
                        )}
                        {d.fileUrl && (
                          <div>
                            <a
                              href={d.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
                            >
                              <ExternalLink size={12} /> View File Attachment
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions for Client */}
                    {d.status === 'SUBMITTED' && (role === ROLES.CLIENT || role === ROLES.SUPER_ADMIN) && (
                      <div className="flex gap-2 mt-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => setActionModal({ open: true, item: d, type: 'DELIVERABLE', actionType: 'APPROVED' })}
                          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setActionModal({ open: true, item: d, type: 'DELIVERABLE', actionType: 'REJECTED' })}
                          className="flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* PM/Admin-created Approval Requests Cards */}
                {requiringApprovalApps.map((a) => (
                  <div
                    key={`app-${a.id}`}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:border-orange-200 transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded uppercase">
                            {formatEnum(a.entityType)} Request
                          </span>
                          <h4 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                            {a.title}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[a.status] || STATUS_COLORS.PENDING}`}>
                          {formatEnum(a.status)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-3 mb-4 whitespace-pre-wrap">{a.comments || 'No description notes provided.'}</p>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {a.requestedByName && (
                          <div><span className="font-medium text-slate-700">Requested by:</span> {a.requestedByName}</div>
                        )}
                        {a.clientName && (
                          <div><span className="font-medium text-slate-700">Client:</span> {a.clientName}</div>
                        )}
                        <div><span className="font-medium text-slate-700">Date:</span> {new Date(a.createdAt).toLocaleDateString()}</div>
                        {a.attachmentUrl && (
                          <div>
                            <a
                              href={a.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
                            >
                              <ExternalLink size={12} /> Attachment Link
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions for Approval Request */}
                    {a.status === 'PENDING' && (
                      <div className="flex gap-2 mt-2 pt-4 border-t border-slate-100">
                        {user?.id !== a.requestedById && (
                          <button
                            onClick={() => setActionModal({ open: true, item: a, type: 'APPROVAL', actionType: 'APPROVED' })}
                            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => setActionModal({ open: true, item: a, type: 'APPROVAL', actionType: 'REJECTED' })}
                          className="flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Your Pending Requests Container */}
          {(filterStatus === 'ALL' || filterStatus === 'PENDING') && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="text-orange-500" size={18} />
                Your Pending Requests
              </h3>
              {pendingClientRequests.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800">No pending requests</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    You have no pending requests submitted. PM/Org Admin will review them when created.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingClientRequests.map((a) => (
                    <div
                      key={`app-client-${a.id}`}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:border-orange-200 transition-all group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded uppercase">
                              {formatEnum(a.entityType)} Request
                            </span>
                            <h4 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                              {a.title}
                            </h4>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[a.status] || STATUS_COLORS.PENDING}`}>
                            {formatEnum(a.status)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 line-clamp-3 mb-4 whitespace-pre-wrap">{a.comments || 'No description notes provided.'}</p>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {a.requestedByName && (
                            <div><span className="font-medium text-slate-700">Requested by:</span> {a.requestedByName} (You)</div>
                          )}
                          <div><span className="font-medium text-slate-700">Date:</span> {new Date(a.createdAt).toLocaleDateString()}</div>
                          {a.attachmentUrl && (
                            <div>
                              <a
                                href={a.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
                              >
                                <ExternalLink size={12} /> Attachment Link
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Only Delete button available */}
                      <div className="flex gap-2 mt-2 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => setDeleteModal({ open: true, approvalId: a.id, projectId: a.projectId })}
                          className="w-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROGRESS & MILESTONES */}
      {activeTab === 'progress' && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Milestone Timeline & Deliverables Roadmap</h3>
            <span className="text-xs font-semibold text-slate-500">
              {completedMilestonesCount} of {milestones.length} milestones complete
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${milestones.length > 0 ? (completedMilestonesCount / milestones.length) * 100 : 0}%` }}
            />
          </div>

          <div className="space-y-6 pt-4">
            {milestones.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No milestones defined for this project yet.</div>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                {milestones.map((m) => {
                  const associatedDeliverables = deliverables.filter((d) => d.milestoneId === m.id);
                  return (
                    <div key={m.id} className="relative pl-6">
                      <div
                        className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${m.status === 'ACHIEVED'
                          ? 'bg-emerald-500'
                          : m.status === 'IN_PROGRESS'
                            ? 'bg-blue-500'
                            : 'bg-slate-300'
                          }`}
                      />
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="text-base font-bold text-slate-900">{m.title}</h4>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${m.status === 'ACHIEVED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : m.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                              {formatEnum(m.status)}
                            </span>
                            <span className="text-xs text-slate-500">
                              Target Date: {m.expectedDeliveryDate || 'TBD'}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">{m.description || 'No milestone details provided.'}</p>

                        {associatedDeliverables.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">Deliverables:</span>
                            {associatedDeliverables.map((d) => (
                              <span
                                key={d.id}
                                className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium"
                              >
                                📄 {d.title} (v{d.version})
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${STATUS_COLORS[d.status]}`}>
                                  {d.status}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AI SPECIFICATIONS REVIEW */}
      {activeTab === 'specs' && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">AI Specifications & Architecture Documents</h3>
            <Link
              to={`/projects/${project.id}/specs`}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              Open Spec Studio <ArrowRight size={12} />
            </Link>
          </div>

          {specs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-slate-800">No specifications created yet</h4>
              <p className="text-xs text-slate-500 mt-1">
                Specifications generated in the AI Spec Studio will appear here for client review and sign-off.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specs.map((spec) => (
                <div key={spec.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:border-orange-200 transition-colors">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900">{spec.title}</h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[spec.status] || STATUS_COLORS.DRAFT}`}>
                        {formatEnum(spec.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                      {spec.overview || spec.description || 'AI-generated specification detailing architecture, tech stack, and user stories.'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg">
                      <div><span className="font-medium text-slate-700">Version:</span> v{spec.currentVersion || spec.version || 1}</div>
                      <div><span className="font-medium text-slate-700">Stories:</span> {spec.userStoriesCount || spec.userStories?.length || 0}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <Link
                      to={`/projects/${project.id}/specs/${spec.id}`}
                      className="flex-1 text-center py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Review Full Spec
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <ShieldCheck size={18} className="text-orange-500" /> Tamper-Proof Audit Trail
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No activity recorded matching your search.</div>
            ) : (
              filteredAuditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{log.userName || 'System'}</span>
                      <span className="text-xs text-slate-500">performed</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {log.action}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">{log.details}</p>
                  <div className="text-[10px] text-slate-400 mt-2 font-mono">
                    Ref: {log.entityType} #{log.entityId}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CLIENT REVIEW ACTION MODAL */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {actionModal.actionType === 'APPROVED'
                ? 'Approve Item'
                : actionModal.actionType === 'REJECTED'
                  ? 'Decline Item'
                  : 'Request Revision / Changes'}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              You are about to <strong className="text-slate-800">{formatEnum(actionModal.actionType).toLowerCase()}</strong> "{actionModal.item?.title}".
              {actionModal.actionType !== 'APPROVED' && ' Please provide detailed feedback notes below.'}
            </p>

            <form onSubmit={handleClientAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Comments / Feedback {actionModal.actionType !== 'APPROVED' && '*'}
                </label>
                <textarea
                  required={actionModal.actionType !== 'APPROVED'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[110px]"
                  placeholder="Enter your feedback or approval comments..."
                  value={actionForm.comments}
                  onChange={(e) => setActionForm({ ...actionForm, comments: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attachment URL (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://..."
                  value={actionForm.attachedFileUrl}
                  onChange={(e) => setActionForm({ ...actionForm, attachedFileUrl: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                {actionModal.actionType === 'APPROVED' ? (
                  <button
                    type="submit"
                    disabled={submittingAction}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submittingAction ? 'Submitting...' : 'Confirm Approval'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={(e) => {
                        setActionModal(prev => ({ ...prev, actionType: 'CHANGES_REQUESTED' }));
                        handleClientAction(e);
                      }}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm bg-amber-600 hover:bg-amber-700"
                    >
                      {submittingAction && actionModal.actionType === 'CHANGES_REQUESTED' ? 'Submitting...' : 'Submit Changes Request'}
                    </button>
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={(e) => {
                        setActionModal(prev => ({ ...prev, actionType: 'REJECTED' }));
                        handleClientAction(e);
                      }}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm bg-rose-600 hover:bg-rose-700"
                    >
                      {submittingAction && actionModal.actionType === 'REJECTED' ? 'Submitting...' : 'Confirm Hard Decline'}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  disabled={submittingAction}
                  className="flex-1 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                  onClick={() => setActionModal({ open: false, item: null, type: 'DELIVERABLE', actionType: '' })}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST APPROVAL MODAL */}
      {requestModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Request Approval</h3>
            <p className="text-xs text-slate-500 mb-5">
              Submit a formal approval or sign-off request for a deliverable, specification, milestone, or custom requirement.
            </p>

            {requestModalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>{requestModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateApprovalRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Request Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design System Phase 1 Sign-Off"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scope / Category *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    value={requestForm.entityType}
                    onChange={(e) => setRequestForm({ ...requestForm, entityType: e.target.value })}
                  >
                    <option value="" disabled>Select category...</option>
                    <option value="GENERAL">General Sign-off</option>
                    <option value="DELIVERABLE">Deliverable</option>
                    <option value="SPECIFICATION">AI Specification</option>
                    <option value="MILESTONE">Milestone</option>
                    <option value="CHANGE_REQUEST">Change Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Milestone *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    value={requestForm.entityId}
                    onChange={(e) => setRequestForm({ ...requestForm, entityId: e.target.value })}
                  >
                    <option value="" disabled>Select a milestone...</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Acceptance Criteria</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[90px]"
                  placeholder="Explain what requires review, criteria to verify, or change summary..."
                  value={requestForm.comments}
                  onChange={(e) => setRequestForm({ ...requestForm, comments: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attachment or Reference URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/... or https://figma.com/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={requestForm.attachmentUrl}
                  onChange={(e) => setRequestForm({ ...requestForm, attachmentUrl: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  {submittingRequest ? 'Submitting...' : 'Submit Approval Request'}
                </button>
                <button
                  type="button"
                  disabled={submittingRequest}
                  className="flex-1 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                  onClick={() => setRequestModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Request</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this request?
            </p>
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={deletingRequest}
                onClick={handleDeleteApproval}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                {deletingRequest ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                disabled={deletingRequest}
                className="flex-1 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                onClick={() => setDeleteModal({ open: false, approvalId: null, projectId: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
