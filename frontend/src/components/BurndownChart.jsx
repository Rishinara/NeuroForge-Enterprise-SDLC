import React, { useState } from 'react'

export default function BurndownChart({ data, width = 640, height = 220 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)

  if (!data || data.length === 0) return null

  // Ensure minimum 2 points so lines render properly
  let chartData = data
  if (chartData.length === 1) {
    chartData = [
      { ...chartData[0], day: 'Start' },
      { ...chartData[0], day: 'Current' }
    ]
  }

  const padding = { top: 24, right: 28, bottom: 34, left: 38 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const maxY = Math.max(...chartData.map((d) => Math.max(d.remaining ?? 0, d.ideal ?? 0)), 10)
  const stepX = innerW / Math.max(chartData.length - 1, 1)

  function xFor(i) {
    return padding.left + i * stepX
  }

  function yFor(v) {
    const safeV = Math.max(0, Number(v) || 0)
    return padding.top + innerH - (safeV / maxY) * innerH
  }

  const idealPoints = chartData.map((d, i) => `${xFor(i)},${yFor(d.ideal ?? 0)}`).join(' ')
  const remainingPoints = chartData.map((d, i) => `${xFor(i)},${yFor(d.remaining ?? 0)}`).join(' ')

  const areaPoints = [
    `${xFor(0)},${padding.top + innerH}`,
    ...chartData.map((d, i) => `${xFor(i)},${yFor(d.remaining ?? 0)}`),
    `${xFor(chartData.length - 1)},${padding.top + innerH}`,
  ].join(' ')

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Sprint burndown chart"
        className="overflow-visible select-none"
      >
        <defs>
          <linearGradient id="burndown-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines & Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
          const y = padding.top + innerH * frac
          const val = Math.round(maxY * (1 - frac))
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fontSize="10"
                fill="#94a3b8"
                textAnchor="end"
                className="font-mono font-medium"
              >
                {val}p
              </text>
            </g>
          )
        })}

        {/* Gradient fill beneath actual velocity */}
        <polygon points={areaPoints} fill="url(#burndown-gradient)" />

        {/* Ideal Guideline */}
        <polyline
          points={idealPoints}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.75"
          strokeDasharray="4 4"
        />

        {/* Actual Remaining Line */}
        <polyline
          points={remainingPoints}
          fill="none"
          stroke="#ea580c"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartData.map((d, i) => {
          const cx = xFor(i)
          const cy = yFor(d.remaining ?? 0)
          const isHovered = hoveredPoint === i

          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? '6' : '4'}
                fill="#ffffff"
                stroke="#ea580c"
                strokeWidth={isHovered ? '2.5' : '2'}
                className="transition-all duration-150"
              />
              {isHovered && (
                <g>
                  <rect
                    x={cx - 38}
                    y={cy - 30}
                    width="76"
                    height="22"
                    rx="4"
                    fill="#0f172a"
                  />
                  <text
                    x={cx}
                    y={cy - 15}
                    fill="#ffffff"
                    fontSize="10.5"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {d.remaining ?? 0} pts left
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* X-axis labels */}
        {chartData.map((d, i) => {
          if (chartData.length > 8 && i % 2 !== 0 && i !== chartData.length - 1) return null
          return (
            <text
              key={i}
              x={xFor(i)}
              y={height - 10}
              fontSize="10"
              fill="#64748b"
              fontWeight="600"
              textAnchor="middle"
            >
              {d.day || `D${i + 1}`}
            </text>
          )
        })}
      </svg>

      {/* Chart Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs font-semibold text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-b-2 border-dashed border-slate-400" />
          <span>Ideal Burn Velocity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1 rounded-full bg-orange-600 inline-block" />
          <span className="text-orange-600 font-bold">Actual Story Points Remaining</span>
        </div>
      </div>
    </div>
  )
}