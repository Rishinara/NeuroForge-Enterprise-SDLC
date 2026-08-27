export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 w-fit mb-6">
      {tabs.map((t) => {
        const isActive = active === t.key
        return (
          <button
            key={t.key}
            type="button"
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 ${
              isActive
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
            }`}
            onClick={() => onChange(t.key)}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}