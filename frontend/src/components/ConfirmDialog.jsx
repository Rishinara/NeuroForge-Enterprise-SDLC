import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, title, message, onClose, onConfirm, confirmText = "Confirm", isDestructive = false }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all shadow-xs active:scale-[0.98]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button"
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all shadow-xs active:scale-[0.98] ${
              isDestructive 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20' 
                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20'
            }`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        {isDestructive ? (
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}
