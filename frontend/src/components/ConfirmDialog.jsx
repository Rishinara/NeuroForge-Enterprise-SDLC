import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, title, message, onClose, onConfirm, confirmText = "Confirm", isDestructive = false }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button className="wk-btn wk-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className={`wk-btn ${isDestructive ? 'bg-red-500 hover:bg-red-600 text-white' : 'wk-btn-primary'}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      }
    >
      <div className="text-slate-600 text-sm">
        {message}
      </div>
    </Modal>
  );
}
