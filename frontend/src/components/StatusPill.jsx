const STATUS_MAP = {
  DRAFT: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200/80', dot: 'bg-slate-400' },
  Draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200/80', dot: 'bg-slate-400' },
  'IN_REVIEW': { label: 'In Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80', dot: 'bg-amber-500' },
  'In Review': { label: 'In Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80', dot: 'bg-amber-500' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500' },
  Approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', dot: 'bg-emerald-500' },
  'CHANGES_REQUESTED': { label: 'Changes Requested', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/80', dot: 'bg-rose-500' },
  'Changes Requested': { label: 'Changes Requested', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/80', dot: 'bg-rose-500' },
  SUBMITTED: { label: 'Submitted', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80', dot: 'bg-blue-500' },
  Submitted: { label: 'Submitted', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80', dot: 'bg-blue-500' },
  SUPERSEDED: { label: 'Superseded', bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400' },
}

export default function StatusPill({ status }) {
  const config = STATUS_MAP[status] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} shadow-2xs whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}