import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

function AiFeatureCard({ feature }) {
  const navigate = useNavigate();
  const Icon = feature.icon;

  return (
    <div className="card flex flex-col items-center gap-3 p-6 text-center transition-transform hover:-translate-y-0.5">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="font-semibold">{feature.title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
      <button onClick={() => navigate(`/ai-assistant/${feature.id}`)} className="btn-primary mt-2 w-full sm:w-auto">
        Use Now
      </button>
    </div>
  );
}

export default memo(AiFeatureCard);
