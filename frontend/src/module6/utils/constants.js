export const CATEGORIES = ['Backend', 'Frontend', 'DevOps', 'Database', 'Mobile', 'Security', 'QA'];

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const STATUSES = ['Open', 'Assigned', 'In Progress', 'Closed'];

export const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export const PRIORITY_STYLES = {
  Critical: {
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-950/40',
    ring: 'ring-red-200 dark:ring-red-900',
  },
  High: {
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    ring: 'ring-orange-200 dark:ring-orange-900',
  },
  Medium: {
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    ring: 'ring-amber-200 dark:ring-amber-900',
  },
  Low: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    ring: 'ring-emerald-200 dark:ring-emerald-900',
  },
};

export const STATUS_STYLES = {
  Open: {
    dot: 'bg-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
  },
  Assigned: {
    dot: 'bg-brand-500',
    text: 'text-brand-700 dark:text-brand-300',
    bg: 'bg-brand-50 dark:bg-brand-950/40',
  },
  'In Progress': {
    dot: 'bg-violet-500',
    text: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
  },
  Closed: {
    dot: 'bg-slate-400',
    text: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
  },
};
