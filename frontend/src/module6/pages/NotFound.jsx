import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-light px-6 text-center dark:bg-surface-dark">
      <svg width="220" height="180" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of a disconnected ticket">
        <rect x="30" y="40" width="160" height="100" rx="14" className="fill-panel-light dark:fill-panel-dark" stroke="currentColor" strokeOpacity="0.15" />
        <circle cx="30" cy="90" r="10" className="fill-surface-light dark:fill-surface-dark" stroke="currentColor" strokeOpacity="0.15" />
        <circle cx="190" cy="90" r="10" className="fill-surface-light dark:fill-surface-dark" stroke="currentColor" strokeOpacity="0.15" />
        <line x1="60" y1="70" x2="150" y2="70" stroke="#F97316" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <line x1="60" y1="90" x2="120" y2="90" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" />
        <line x1="60" y1="108" x2="100" y2="108" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" />
        <circle cx="165" cy="110" r="26" fill="#EF4444" opacity="0.12" />
        <path d="M156 101L174 119M174 101L156 119" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight">404</h1>
      <p className="mt-2 text-lg font-semibold text-ink-light dark:text-ink-dark">This ticket route doesn&apos;t exist</p>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        The page you&apos;re looking for was moved, deleted, or never existed. Head back to the dashboard to keep triaging.
      </p>
      <button onClick={() => navigate('/dashboard')} className="btn-primary mt-6">
        <FiArrowLeft size={16} /> Back to dashboard
      </button>
    </div>
  );
}

export default NotFound;
