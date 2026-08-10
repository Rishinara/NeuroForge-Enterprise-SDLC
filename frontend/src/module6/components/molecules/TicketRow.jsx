import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import PriorityBadge from '../atoms/PriorityBadge.jsx';
import StatusBadge from '../atoms/StatusBadge.jsx';
import Avatar from '../atoms/Avatar.jsx';
import { formatDate } from '../../utils/formatters.js';

function TicketRow({ ticket, onDeleteRequest }) {
  const navigate = useNavigate();

  return (
    <tr className="group border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40">
      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-slate-400">#{ticket.id}</td>
      <td className="max-w-[280px] px-4 py-3.5">
        <button
          onClick={() => navigate(`/tickets/${ticket.id}`)}
          className="truncate text-left text-sm font-medium text-ink-light hover:text-brand-600 hover:underline dark:text-ink-dark dark:hover:text-brand-400"
        >
          {ticket.title}
        </button>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{ticket.category}</td>
      <td className="whitespace-nowrap px-4 py-3.5">
        <PriorityBadge priority={ticket.priority} size="sm" />
      </td>
      <td className="whitespace-nowrap px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Avatar name={ticket.assignee} size="sm" />
          <span className="hidden text-sm text-slate-600 dark:text-slate-300 lg:inline">{ticket.assignee}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">{formatDate(ticket.createdAt)}</td>
      <td className="whitespace-nowrap px-4 py-3.5">
        <StatusBadge status={ticket.status} size="sm" />
      </td>
      <td className="whitespace-nowrap px-4 py-3.5">
        <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => navigate(`/tickets/${ticket.id}`)}
            aria-label={`View ticket ${ticket.id}`}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <FiEye size={15} />
          </button>
          <button
            onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
            aria-label={`Edit ticket ${ticket.id}`}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <FiEdit2 size={15} />
          </button>
          <button
            onClick={() => onDeleteRequest(ticket)}
            aria-label={`Delete ticket ${ticket.id}`}
            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40"
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default memo(TicketRow);
