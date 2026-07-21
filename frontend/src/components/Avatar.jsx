const PALETTE = ['#ff6b35', '#6c63ff', '#0891b2', '#16a34a', '#d946a0', '#f59e0b']

function colorForName(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initialsForName(name) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export default function Avatar({ name, size = 36 }) {
  const bg = colorForName(name || '?')
  const initials = initialsForName(name || '?')

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        fontFamily: 'Space Grotesk, sans-serif',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}