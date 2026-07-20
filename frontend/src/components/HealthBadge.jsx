const STYLES = {
  'On Track': { bg: '#dcfce7', color: '#166534' },
  'At Risk': { bg: '#fef3c7', color: '#92400e' },
  'Delayed': { bg: '#fee2e2', color: '#991b1b' },
}

export default function HealthBadge({ status }) {
  const style = STYLES[status] || { bg: '#f1f5f9', color: '#475569' }
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        fontSize: 11,
        fontWeight: 600,
        padding: '3px 9px',
        borderRadius: 999,
      }}
    >
      {status}
    </span>
  )
}