import { STATUSES } from '../../utils/constants.js';

function Timeline({ status }) {
  const currentIndex = STATUSES.indexOf(status);

  return (
    <ol className="flex items-center" aria-label="Ticket status timeline">
      {STATUSES.map((step, index) => {
        const complete = index <= currentIndex;
        const isLast = index === STATUSES.length - 1;
        return (
          <li key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-3 w-3 rounded-full ring-4 ${
                  complete
                    ? 'bg-brand-500 ring-brand-100 dark:ring-brand-900/50'
                    : 'bg-slate-200 ring-slate-50 dark:bg-slate-700 dark:ring-slate-900'
                }`}
                aria-current={index === currentIndex ? 'step' : undefined}
              />
              <span className={`whitespace-nowrap text-xs font-medium ${complete ? 'text-ink-light dark:text-ink-dark' : 'text-slate-400'}`}>
                {step}
              </span>
            </div>
            {!isLast && (
              <div className={`mx-2 h-0.5 flex-1 rounded-full ${index < currentIndex ? 'bg-brand-500' : 'bg-slate-150 dark:bg-slate-700'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default Timeline;
