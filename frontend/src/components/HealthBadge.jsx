const STYLES = {
  ON_TRACK: { bg: '#dcfce7', color: '#166534', label: 'On Track' },
  AT_RISK: { bg: '#fef3c7', color: '#92400e', label: 'At Risk' },
  DELAYED: { bg: '#fee2e2', color: '#991b1b', label: 'Delayed' },
}

export default function HealthBadge({ status }) {
  const style = STYLES[status] || { bg: '#f1f5f9', color: '#475569', label: status || 'Unknown' }
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
      {style.label}
    </span>
  )
}