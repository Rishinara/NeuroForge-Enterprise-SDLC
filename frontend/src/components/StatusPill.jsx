const STYLES = {
  Draft: { bg: '#f3f4f6', color: '#4b5563' },
  'In Review': { bg: '#fef3c7', color: '#92400e' },
  Approved: { bg: '#dcfce7', color: '#166534' },
  'Changes Requested': { bg: '#fee2e2', color: '#991b1b' },
}

export default function StatusPill({ status }) {
  const style = STYLES[status] || { bg: '#f3f4f6', color: '#4b5563' }
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  )
}