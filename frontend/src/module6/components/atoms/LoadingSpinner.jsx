import { FiLoader } from 'react-icons/fi';

function LoadingSpinner({ label = 'Loading', size = 20, className = '' }) {
  return (
    <span role="status" aria-live="polite" className={`inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 ${className}`}>
      <FiLoader size={size} className="animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </span>
  );
}

export default LoadingSpinner;
