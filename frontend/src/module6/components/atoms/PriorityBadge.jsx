import { memo } from 'react';
import { PRIORITY_STYLES } from '../../utils/constants.js';

function PriorityBadge({ priority, size = 'md' }) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${style.bg} ${style.text} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {priority}
    </span>
  );
}

export default memo(PriorityBadge);
