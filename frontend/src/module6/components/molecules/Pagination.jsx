import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function Pagination({ page, totalPages, onPageChange, totalResults, pageSize }) {
  if (totalResults === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalResults);

  return (
    <nav className="flex flex-col-reverse items-center justify-between gap-3 border-t border-slate-100 px-1 py-4 dark:border-slate-800 sm:flex-row" aria-label="Pagination">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing <span className="font-medium text-ink-light dark:text-ink-dark">{start}–{end}</span> of{' '}
        <span className="font-medium text-ink-light dark:text-ink-dark">{totalResults}</span> tickets
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="btn-ghost h-9 w-9 p-0"
        >
          <FiChevronLeft size={16} />
        </button>
        <span className="px-2 text-sm font-medium tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="btn-ghost h-9 w-9 p-0"
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
