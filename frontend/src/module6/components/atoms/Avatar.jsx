import { memo } from 'react';
import { getInitials } from '../../utils/formatters.js';

const PALETTE = [
  'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
];

function hashString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function Avatar({ name, size = 'md' }) {
  const colorClass = PALETTE[hashString(name) % PALETTE.length];
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : size === 'lg' ? 'h-11 w-11 text-base' : 'h-9 w-9 text-sm';

  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${colorClass} ${sizeClass}`}
    >
      {getInitials(name)}
    </span>
  );
}

export default memo(Avatar);
