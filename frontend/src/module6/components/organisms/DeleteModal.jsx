import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

function DeleteModal({ ticket, onConfirm, onCancel, isDeleting }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (ticket) cancelRef.current?.focus();
  }, [ticket]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel();
    }
    if (ticket) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [ticket, onCancel]);

  return (
    <AnimatePresence>
      {ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="card relative w-full max-w-sm p-6"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <FiAlertTriangle size={20} />
            </div>
            <h2 id="delete-modal-title" className="text-base font-semibold">
              Delete ticket #{ticket.id}?
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              This permanently removes “{ticket.title}” and its AI suggestion history. This can&apos;t be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button ref={cancelRef} type="button" onClick={onCancel} className="btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={onConfirm} disabled={isDeleting} className="btn-danger">
                {isDeleting ? 'Deleting…' : 'Delete ticket'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default DeleteModal;
