import { memo } from 'react';
import { motion } from 'framer-motion';

function getColor(confidence) {
  if (confidence >= 90) return '#16A34A';
  if (confidence >= 75) return '#F97316';
  if (confidence >= 60) return '#F59E0B';
  return '#EF4444';
}

function ConfidenceGauge({ confidence = 0, size = 120 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;
  const color = getColor(confidence);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`AI confidence score: ${confidence} percent`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth="8" fill="none" className="stroke-slate-100 dark:stroke-slate-800" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="8"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold tabular-nums font-mono" style={{ color }}>
          {confidence}%
        </span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">confidence</span>
      </div>
    </div>
  );
}

export default memo(ConfidenceGauge);
