const PALETTE = [
  'bg-orange-500 text-white',
  'bg-indigo-600 text-white',
  'bg-blue-600 text-white',
  'bg-emerald-600 text-white',
  'bg-rose-500 text-white',
  'bg-amber-600 text-white',
  'bg-teal-600 text-white',
  'bg-violet-600 text-white',
]

function colorClassForName(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initialsForName(name) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || '?'
}

export default function Avatar({ name, size = 36, className = '' }) {
  const colorClass = colorClassForName(name || '?')
  const initials = initialsForName(name || '?')

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold tracking-tight shrink-0 ring-2 ring-white/80 dark:ring-slate-800 shadow-2xs ${colorClass} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.38),
      }}
      title={name || 'User'}
    >
      {initials}
    </div>
  )
}