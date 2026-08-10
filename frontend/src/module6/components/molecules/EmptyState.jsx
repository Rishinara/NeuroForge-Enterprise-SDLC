import { FiInbox } from 'react-icons/fi';

function EmptyState({ icon: Icon = FiInbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon size={24} aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold text-ink-light dark:text-ink-dark">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default EmptyState;
