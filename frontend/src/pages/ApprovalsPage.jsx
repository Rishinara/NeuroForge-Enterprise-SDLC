import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { api, extractErrorMessage } from '../api/client.js'
import { approvalApi } from '../api/approvalApi.js'
import { deliverableApi } from '../api/deliverableApi.js'
import { projectApi } from '../api/projectApi.js'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  ExternalLink,
  ShieldCheck,
  Flag,
  Sparkles,
  Filter,
  FileText
} from 'lucide-react'

const STATUS_COLORS = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CHANGES_REQUESTED: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200'
}

const formatEnum = (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown'

export default function ApprovalsPage() {
  const { projectId } = useParams()
  const { role, user } = useAuth()
  const [deliverables, setDeliverables] = useState([])
  const [approvals, setApprovals] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [project, setProject] = useState(null)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [creatingApproval, setCreatingApproval] = useState(false)

  // Request Approval Modal (for Client / PM)
  const [requestApprovalModal, setRequestApprovalModal] = useState(false)
  const [modalError, setModalError] = useState('')
  const [approvalForm, setApprovalForm] = useState({
    title: '',
    entityType: '',
    entityId: '',
    comments: '',
    attachmentUrl: '',
    clientId: ''
  })

  // Action / Decision Modal (for Client review)
  const [actionModal, setActionModal] = useState({ open: false, item: null, type: 'DELIVERABLE', actionType: '' })
  const [actionForm, setActionForm] = useState({ comments: '', attachedFileUrl: '' })
  const [actionError, setActionError] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)

  const loadData = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      const [delRes, appRes, milRes, projRes] = await Promise.all([
        deliverableApi.getDeliverables(projectId).catch(() => ({ data: [] })),
        approvalApi.getApprovals(projectId).catch(() => ({ data: [] })),
        api.get(`/projects/${projectId}/milestones`).catch(() => ({ data: [] })),
        projectApi.getProject(projectId).catch(() => ({ data: null }))
      ])
      setDeliverables(Array.isArray(delRes.data) ? delRes.data : [])
      setApprovals(Array.isArray(appRes.data) ? appRes.data : [])
      setMilestones(Array.isArray(milRes.data) ? milRes.data : [])
      setProject(projRes.data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])


  const handleCreateApproval = async (e) => {
    e.preventDefault()
    setModalError('')

    const trimmedTitle = approvalForm.title ? approvalForm.title.trim() : ''
    if (!trimmedTitle) {
      setModalError('Request Title is required.')
      return
    }
    if (trimmedTitle.length < 3) {
      setModalError('Request Title must be at least 3 characters long.')
      return
    }

    if (!approvalForm.entityType) {
      setModalError('Please select a Scope / Category for this approval request.')
      return
    }

    if (!approvalForm.entityId) {
      if (!milestones || milestones.length === 0) {
        setModalError('No milestones exist for this project. Please create a milestone first before requesting approval.')
      } else {
        setModalError('Please select a Milestone for this approval request.')
      }
      return
    }

    if (role !== ROLES.CLIENT) {
      const clientMembers = project?.team?.filter(m => m.projectRole === 'CLIENT' || m.role === 'CLIENT') || []
      if (clientMembers.length === 0) {
        setModalError('No Client team member is assigned to this project. Please assign a Client to the project team before requesting client approval.')
        return
      }
      if (!approvalForm.clientId) {
        setModalError('Please select a Client for this approval request.')
        return
      }
    }

    if (approvalForm.attachmentUrl && approvalForm.attachmentUrl.trim()) {
      const url = approvalForm.attachmentUrl.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setModalError('Attachment URL must start with http:// or https://')
        return
      }
    }

    setCreatingApproval(true)
    try {
      await approvalApi.createApproval(projectId, {
        title: trimmedTitle,
        entityType: approvalForm.entityType,
        entityId: approvalForm.entityId ? Number(approvalForm.entityId) : null,
        comments: approvalForm.comments ? approvalForm.comments.trim() : '',
        attachmentUrl: approvalForm.attachmentUrl ? approvalForm.attachmentUrl.trim() : '',
        clientId: approvalForm.clientId ? Number(approvalForm.clientId) : null,
        projectId: Number(projectId)
      })
      setRequestApprovalModal(false)
      setApprovalForm({
        title: '',
        entityType: '',
        entityId: '',
        comments: '',
        attachmentUrl: '',
        clientId: ''
      })
      setModalError('')
      await loadData()
    } catch (err) {
      setModalError(extractErrorMessage(err))
    } finally {
      setCreatingApproval(false)
    }
  }

  const handleSubmitToClient = async (id) => {
    if (!confirm('Submit this deliverable to the client for formal review?')) return
    try {
      await deliverableApi.submitDeliverable(projectId, id)
      await loadData()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  const handleClientAction = async (e) => {
    e.preventDefault()
    setActionError('')
    if (!actionModal.item) return

    if (actionModal.actionType !== 'APPROVED' && (!actionForm.comments || !actionForm.comments.trim())) {
      setActionError('Feedback comments are required when declining or requesting changes.')
      return
    }

    if (actionForm.attachedFileUrl && actionForm.attachedFileUrl.trim()) {
      const url = actionForm.attachedFileUrl.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setActionError('Attachment URL must start with http:// or https://')
        return
      }
    }

    setSubmittingAction(true)
    try {
      if (actionModal.type === 'DELIVERABLE') {
        await deliverableApi.clientAction(projectId, actionModal.item.id, {
          action: actionModal.actionType,
          comments: actionForm.comments ? actionForm.comments.trim() : '',
          attachedFileUrl: actionForm.attachedFileUrl ? actionForm.attachedFileUrl.trim() : ''
        })
      } else {
        await approvalApi.actionApproval(projectId, actionModal.item.id, {
          status: actionModal.actionType,
          comments: actionForm.comments ? actionForm.comments.trim() : '',
          attachmentUrl: actionForm.attachedFileUrl ? actionForm.attachedFileUrl.trim() : ''
        })
      }
      setActionModal({ open: false, item: null, type: 'DELIVERABLE', actionType: '' })
      setActionForm({ comments: '', attachedFileUrl: '' })
      setActionError('')
      await loadData()
    } catch (err) {
      setActionError(extractErrorMessage(err))
    } finally {
      setSubmittingAction(false)
    }
  }

  const handleDeleteApproval = async (approvalId) => {
    if (!confirm('Are you sure you want to delete this approval request?')) return
    try {
      await approvalApi.deleteApproval(projectId, approvalId)
      await loadData()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  const isPMOrAdmin = role === ROLES.PROJECT_MANAGER || role === ROLES.SUPER_ADMIN || role === ROLES.ORG_ADMIN
  const isClient = role === ROLES.CLIENT

  // Filter Items
  const filteredDeliverables = deliverables.filter((d) => {
    if (d.status === 'DRAFT' && isClient) return false
    if (filterStatus === 'ALL') return true
    if (filterStatus === 'PENDING') return d.status === 'SUBMITTED'
    return d.status === filterStatus
  })

  const filteredApprovals = approvals.filter((a) => {
    if (filterStatus === 'ALL') return true
    return a.status === filterStatus
  })

  // Items Requiring Your Approval (Items created by OTHER party pending action)
  const requiringApprovalApps = filteredApprovals.filter(a =>
    a.status === 'PENDING' && (isClient ? a.requestedByRole !== 'CLIENT' : a.requestedByRole === 'CLIENT')
  )
  const requiringApprovalDeliverables = isClient ? filteredDeliverables.filter(d => d.status === 'SUBMITTED') : []

  // Your Pending Requests (Items created by LOGGED-IN user party pending action)
  const yourPendingRequests = filteredApprovals.filter(a =>
    a.status === 'PENDING' && (isClient ? a.requestedByRole === 'CLIENT' : a.requestedByRole !== 'CLIENT')
  )
  const yourSubmittedDeliverables = !isClient ? filteredDeliverables.filter(d => d.status === 'SUBMITTED') : []

  // History / other items to show under appropriate sections
  const otherApprovals = filteredApprovals.filter(a => a.status !== 'PENDING')
  const otherDeliverables = filteredDeliverables.filter(d => d.status !== 'SUBMITTED')

    const pendingCount = deliverables.filter(d => d.status === 'SUBMITTED').length + approvals.filter(a => a.status === 'PENDING').length
  const approvedCount = deliverables.filter(d => d.status === 'APPROVED').length + approvals.filter(a => a.status === 'APPROVED').length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-orange-500" size={26} />
            Request Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review submitted deliverables, approve project milestones, or request formal client sign-offs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setRequestApprovalModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Plus size={16} />
            Request
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{pendingCount}</div>
            <div className="text-xs text-slate-500 font-medium">Pending Action</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{approvedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Approved & Signed Off</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Flag size={20} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{milestones.length}</div>
            <div className="text-xs text-slate-500 font-medium">Target Milestones</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
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
            ...(isPMOrAdmin ? [{ key: 'DRAFT', label: 'Drafts' }] : []),
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

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {loading && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading deliverables and approvals...</p>
        </div>
      )}

      {/* Main List of Deliverables and Approvals */}
      {!loading && (
        <div className="space-y-6">
          {/* Container 1: Items Requiring Your Approval */}
          {(filterStatus === 'ALL' || filterStatus === 'PENDING') && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="text-amber-500" size={18} />
                Items Requiring Your Approval
              </h3>
              {requiringApprovalApps.length === 0 && requiringApprovalDeliverables.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800">You're All Caught Up!</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No items are currently waiting for your review.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {/* Deliverables requiring Client approval */}
                  {requiringApprovalDeliverables.map((d) => (
                    <div
                      key={`del-${d.id}`}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-orange-200 transition-all group animate-fadeIn"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">
                            Deliverable
                          </span>
                          <h4 className="text-lg font-bold text-slate-900">{d.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${STATUS_COLORS[d.status] || STATUS_COLORS.DRAFT}`}>
                            {formatEnum(d.status)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 line-clamp-2">{d.description || 'No description provided.'}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                          <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-semibold">v{d.version}</span>
                          {d.milestoneId && (
                            <span>Milestone: {milestones.find((m) => m.id === d.milestoneId)?.title || d.milestoneId}</span>
                          )}
                          {d.authorName && <span>Author: {d.authorName}</span>}
                          {d.fileUrl && (
                            <a
                              href={d.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
                            >
                              <ExternalLink size={12} /> Attachment Link
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Client Review buttons */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => setActionModal({ open: true, item: d, type: 'DELIVERABLE', actionType: 'APPROVED' })}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setActionModal({ open: true, item: d, type: 'DELIVERABLE', actionType: 'REJECTED' })}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Approval Requests requiring approval */}
                  {requiringApprovalApps.map((a) => (
                    <div
                      key={`app-${a.id}`}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-orange-200 transition-all animate-fadeIn"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded uppercase">
                            {formatEnum(a.entityType)} Request
                          </span>
                          <h4 className="text-lg font-bold text-slate-900">{a.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${STATUS_COLORS[a.status] || STATUS_COLORS.PENDING}`}>
                            {formatEnum(a.status)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 line-clamp-2 whitespace-pre-wrap">{a.comments || 'No description provided.'}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                          {a.requestedByName && <span>Requested By: {a.requestedByName}</span>}
                          {a.clientName && <span>Client: {a.clientName}</span>}
                          <span>Date: {new Date(a.createdAt).toLocaleDateString()}</span>
                          {a.attachmentUrl && (
                            <a
                              href={a.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
                            >
                              <ExternalLink size={12} /> Attachment Link
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Actions: Approve & Decline */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActionModal({ open: true, item: a, type: 'APPROVAL', actionType: 'APPROVED' })}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setActionModal({ open: true, item: a, type: 'APPROVAL', actionType: 'REJECTED' })}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Container 2: Your Pending Requests */}
          {(filterStatus === 'ALL' || filterStatus === 'PENDING') && (
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="text-orange-500" size={18} />
                Your Pending Requests
              </h3>
              {yourPendingRequests.length === 0 && yourSubmittedDeliverables.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800">No pending requests</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Requests or deliverables created by you waiting for review will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {/* User-created Pending Approval Requests */}
                  {yourPendingRequests.map((a) => (
                    <div
                      key={`app-${a.id}`}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-orange-200 transition-all animate-fadeIn"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded uppercase">
                            {formatEnum(a.entityType)} Request
                          </span>
                          <h4 className="text-lg font-bold text-slate-900">{a.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${STATUS_COLORS[a.status] || STATUS_COLORS.PENDING}`}>
                            {formatEnum(a.status)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 line-clamp-2 whitespace-pre-wrap">{a.comments || 'No description provided.'}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                          {a.requestedByName && <span>Requested By: {a.requestedByName} (You)</span>}
                          {a.clientName && <span>Client: {a.clientName}</span>}
                          <span>Date: {new Date(a.createdAt).toLocaleDateString()}</span>
                          {a.attachmentUrl && (
                            <a
                              href={a.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
                            >
                              <ExternalLink size={12} /> Attachment Link
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Action button for user's own requests: ONLY Delete */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteApproval(a.id)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Submitted Deliverables (for PM/Admin) */}
                  {yourSubmittedDeliverables.map((d) => (
                    <div
                      key={`del-${d.id}`}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-orange-200 transition-all group animate-fadeIn"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">
                            Deliverable
                          </span>
                          <h4 className="text-lg font-bold text-slate-900">{d.title}</h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${STATUS_COLORS[d.status] || STATUS_COLORS.DRAFT}`}>
                            {formatEnum(d.status)}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 line-clamp-2">{d.description || 'No description provided.'}</p>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                          <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-semibold">v{d.version}</span>
                          {d.milestoneId && (
                            <span>Milestone: {milestones.find((m) => m.id === d.milestoneId)?.title || d.milestoneId}</span>
                          )}
                          {d.authorName && <span>Author: {d.authorName}</span>}
                          {d.fileUrl && (
                            <a
                              href={d.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
                            >
                              <ExternalLink size={12} /> Attachment Link
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-slate-400 italic">Awaiting Client Review</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Project Deliverables & History */}
          {(otherApprovals.length > 0 || otherDeliverables.length > 0) && (
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="text-slate-500" size={18} />
                Project Deliverables & History
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Other Deliverables */}
                {otherDeliverables.map((d) => (
                  <div
                    key={`del-other-${d.id}`}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-orange-200 transition-all group animate-fadeIn"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">
                          Deliverable
                        </span>
                        <h4 className="text-lg font-bold text-slate-900">{d.title}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${STATUS_COLORS[d.status] || STATUS_COLORS.DRAFT}`}>
                          {formatEnum(d.status)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-2">{d.description || 'No description provided.'}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-semibold">v{d.version}</span>
                        {d.milestoneId && (
                          <span>Milestone: {milestones.find((m) => m.id === d.milestoneId)?.title || d.milestoneId}</span>
                        )}
                        {d.authorName && <span>Author: {d.authorName}</span>}
                        {d.fileUrl && (
                          <a
                            href={d.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> Attachment Link
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      {isPMOrAdmin && (d.status === 'DRAFT' || d.status === 'CHANGES_REQUESTED') && (
                        <button
                          onClick={() => handleSubmitToClient(d.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          Submit to Client
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Other Approvals */}
                {otherApprovals.map((a) => (
                  <div
                    key={`app-other-${a.id}`}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-orange-200 transition-all animate-fadeIn"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded uppercase">
                          {formatEnum(a.entityType)} Request
                        </span>
                        <h4 className="text-lg font-bold text-slate-900">{a.title}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${STATUS_COLORS[a.status] || STATUS_COLORS.PENDING}`}>
                          {formatEnum(a.status)}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-2 whitespace-pre-wrap">{a.comments || 'No description provided.'}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                        {a.requestedByName && <span>Requested By: {a.requestedByName}</span>}
                        {a.clientName && <span>Client: {a.clientName}</span>}
                        <span>Date: {new Date(a.createdAt).toLocaleDateString()}</span>
                        {a.attachmentUrl && (
                          <a
                            href={a.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={12} /> Attachment Link
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state fallback */}
          {requiringApprovalApps.length === 0 && requiringApprovalDeliverables.length === 0 && yourPendingRequests.length === 0 && yourSubmittedDeliverables.length === 0 && otherApprovals.length === 0 && otherDeliverables.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-200 text-center shadow-sm">
              <ShieldCheck className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">No items found</p>
              <p className="text-xs text-slate-500 mt-1">No items match the selected filters.</p>
            </div>
          )}
        </div>
      )}
      {/* MODAL: REQUEST APPROVAL (CLIENT / PM) */}
      {requestApprovalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Request Approval</h3>
            <p className="text-xs text-slate-500 mb-5">
              Submit a formal sign-off or approval request for a project artifact, specification, or deliverable.
            </p>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateApproval} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Request Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 2 Deliverables Approval"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={approvalForm.title}
                  onChange={(e) => setApprovalForm({ ...approvalForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scope / Category *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    value={approvalForm.entityType}
                    onChange={(e) => setApprovalForm({ ...approvalForm, entityType: e.target.value })}
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
                    value={approvalForm.entityId}
                    onChange={(e) => setApprovalForm({ ...approvalForm, entityId: e.target.value })}
                  >
                    <option value="" disabled>Select a milestone...</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {role !== 'CLIENT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Client *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    value={approvalForm.clientId || ''}
                    onChange={(e) => setApprovalForm({ ...approvalForm, clientId: e.target.value })}
                  >
                    <option value="" disabled>Select a client...</option>
                    {project?.team
                      ?.filter(m => m.projectRole === 'CLIENT')
                      ?.map(m => (
                        <option key={m.id} value={m.id}>{m.fullName} ({m.email})</option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes & Acceptance Details</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[90px]"
                  placeholder="Provide context, acceptance criteria, or items to review..."
                  value={approvalForm.comments}
                  onChange={(e) => setApprovalForm({ ...approvalForm, comments: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attachment Link (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={approvalForm.attachmentUrl}
                  onChange={(e) => setApprovalForm({ ...approvalForm, attachmentUrl: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={creatingApproval}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  {creatingApproval ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  disabled={creatingApproval}
                  className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold rounded-lg transition-colors shadow-sm"
                  onClick={() => setRequestApprovalModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DECISION / FEEDBACK ACTION */}
      {actionModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {actionModal.actionType === 'APPROVED'
                ? 'Approve Item'
                : actionModal.actionType === 'REJECTED'
                  ? 'Decline Item'
                  : 'Request Revision'}
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              You are about to <strong className="text-slate-800">{formatEnum(actionModal.actionType).toLowerCase()}</strong> "{actionModal.item?.title}".
              {actionModal.actionType !== 'APPROVED' && ' Please provide feedback comments below.'}
            </p>

            {actionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleClientAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Comments / Notes {actionModal.actionType !== 'APPROVED' && '*'}
                </label>
                <textarea
                  required={actionModal.actionType !== 'APPROVED'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[110px]"
                  placeholder="Enter your comments or reasons for decision..."
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
                      onClick={(e) => { setActionModal(prev => ({ ...prev, actionType: 'CHANGES_REQUESTED' })); handleClientAction(e); }}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors shadow-sm bg-amber-600 hover:bg-amber-700"
                    >
                      {submittingAction && actionModal.actionType === 'CHANGES_REQUESTED' ? 'Submitting...' : 'Submit Changes Request'}
                    </button>
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={(e) => { setActionModal(prev => ({ ...prev, actionType: 'REJECTED' })); handleClientAction(e); }}
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
    </div>
  )
}
