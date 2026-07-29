
export default function BurndownChart({ data, width = 640, height = 200 }) {
  if (!data || data.length === 0) return null

  const padding = { top: 16, right: 16, bottom: 28, left: 32 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const maxY = Math.max(...data.map((d) => Math.max(d.remaining, d.ideal))) || 1
  const stepX = innerW / (data.length - 1 || 1)

  function xFor(i) {
    return padding.left + i * stepX
  }
  function yFor(v) {
    return padding.top + innerH - (v / maxY) * innerH
  }

  const idealPoints = data.map((d, i) => `${xFor(i)},${yFor(d.ideal)}`).join(' ')
  const remainingPoints = data.map((d, i) => `${xFor(i)},${yFor(d.remaining)}`).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sprint burndown chart">
     =
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
        <line
          key={frac}
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + innerH * frac}
          y2={padding.top + innerH * frac}
          stroke="#eceef1"
          strokeWidth="1"
        />
      ))}
=
      <polyline points={idealPoints} fill="none" stroke="#c7cbd4" strokeWidth="2" strokeDasharray="4 4" />
=
      <polyline points={remainingPoints} fill="none" stroke="var(--wk-accent)" strokeWidth="2.5" />
      {data.map((d, i) => (
        <circle key={i} cx={xFor(i)} cy={yFor(d.remaining)} r="3" fill="var(--wk-accent)" />
      ))}

      {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
        <text key={i} x={xFor(i)} y={height - 8} fontSize="10" fill="#9ca3af" textAnchor="middle">
          {data[i].day}
        </text>
      ))}
    </svg>
  )
}