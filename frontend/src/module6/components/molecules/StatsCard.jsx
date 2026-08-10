import { memo } from 'react';

function StatsCard({ label, value, icon: Icon, accent = 'brand' }) {
  const accentClasses = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300',
  }[accent];

  return (
    <div className="card flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentClasses}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default memo(StatsCard);
