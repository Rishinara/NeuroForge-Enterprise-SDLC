import LoadingSpinner from '../atoms/LoadingSpinner.jsx';

function AiResultPanel({ feature, result, loading, error }) {
  const text = result?.[feature.responseKey];

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">AI Response</h3>
        {text && !error && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            Success
          </span>
        )}
      </div>

      {feature.note && (
        <div className="mb-4 rounded-xl border border-brand-100 bg-brand-50/60 p-3 text-xs text-slate-600 dark:border-brand-900/60 dark:bg-brand-950/30 dark:text-slate-300">
          {feature.note}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <LoadingSpinner label="Waiting for AI response…" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          ⚠ {error}
        </div>
      )}

      {!loading && !error && !text && (
        <p className="py-10 text-center text-sm text-slate-400">Fill in the form and submit to see the AI response here.</p>
      )}

      {!loading && !error && text && (
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {text}
        </pre>
      )}
    </div>
  );
}

export default AiResultPanel;
