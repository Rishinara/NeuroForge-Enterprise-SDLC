import { FiCpu } from 'react-icons/fi';

function ReasonCard({ reason }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-900/60 dark:bg-brand-950/30">
      <div className="mb-1.5 flex items-center gap-2 text-brand-700 dark:text-brand-300">
        <FiCpu size={15} aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wide">AI reasoning</span>
      </div>
      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{reason}</p>
    </div>
  );
}

export default ReasonCard;
