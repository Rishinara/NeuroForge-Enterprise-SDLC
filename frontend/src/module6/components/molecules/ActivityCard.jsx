import { FiCheckCircle, FiEdit3, FiPlusCircle, FiUserCheck } from 'react-icons/fi';
import { formatRelativeTime } from '../../utils/formatters.js';

const ICONS = {
  created: { icon: FiPlusCircle, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40' },
  suggested: { icon: FiUserCheck, color: 'text-brand-500 bg-brand-50 dark:bg-brand-950/40' },
  accepted: { icon: FiCheckCircle, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
  edited: { icon: FiEdit3, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
};

function ActivityCard({ type = 'created', title, timestamp, actor }) {
  const config = ICONS[type] || ICONS.created;
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color}`}>
        <Icon size={14} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <p className="text-sm text-ink-light dark:text-ink-dark">{title}</p>
        <p className="text-xs text-slate-400">
          {actor ? `${actor} · ` : ''}
          {formatRelativeTime(timestamp)}
        </p>
      </div>
    </div>
  );
}

export default ActivityCard;
