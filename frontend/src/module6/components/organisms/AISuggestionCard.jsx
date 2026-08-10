import { FiHash, FiLayers, FiTag, FiUser } from 'react-icons/fi';
import ConfidenceGauge from '../atoms/ConfidenceGauge.jsx';
import PriorityBadge from '../atoms/PriorityBadge.jsx';
import Avatar from '../atoms/Avatar.jsx';
import ReasonCard from '../molecules/ReasonCard.jsx';

function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 dark:border-slate-800">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm font-semibold">{children}</div>
      </div>
    </div>
  );
}

function AISuggestionCard({ ticket }) {
  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">AI triage suggestion</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">{ticket.title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ticket #{ticket.id} · reported by {ticket.reporter}</p>
        </div>
        <ConfidenceGauge confidence={ticket.confidence} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field icon={FiTag} label="Category">
          {ticket.category}
        </Field>
        <Field icon={FiLayers} label="Priority">
          <PriorityBadge priority={ticket.priority} />
        </Field>
        <Field icon={FiHash} label="Story points">
          {ticket.storyPoints} pts
        </Field>
        <Field icon={FiUser} label="Suggested assignee">
          <span className="flex items-center gap-2">
            <Avatar name={ticket.assignee} size="sm" />
            {ticket.assignee}
          </span>
        </Field>
      </div>

      <div className="mt-4">
        <ReasonCard reason={ticket.reason} />
      </div>
    </div>
  );
}

export default AISuggestionCard;
