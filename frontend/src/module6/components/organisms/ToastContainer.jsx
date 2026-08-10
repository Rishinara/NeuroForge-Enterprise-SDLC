import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';

const CONFIG = {
  success: { icon: FiCheckCircle, className: 'bg-emerald-500' },
  error: { icon: FiAlertCircle, className: 'bg-red-500' },
  info: { icon: FiInfo, className: 'bg-brand-500' },
};

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = CONFIG[toast.type] || CONFIG.info;
          const Icon = config.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.2 }}
              className="card flex items-start gap-3 border-l-4 p-3.5 pr-2 shadow-soft"
              style={{ borderLeftColor: 'transparent' }}
              role="status"
            >
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${config.className}`}>
                <Icon size={13} />
              </span>
              <p className="flex-1 text-sm leading-snug text-ink-light dark:text-ink-dark">{toast.message}</p>
              <button
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FiX size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;
