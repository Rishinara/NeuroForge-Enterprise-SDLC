export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null

  return (
    <div className="wk-modal-overlay" onClick={onClose}>
      <div className="wk-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="wk-modal-header">
          <h3 className="wk-modal-title">{title}</h3>
          <button className="wk-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="wk-modal-body">{children}</div>
        {footer && <div className="wk-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}