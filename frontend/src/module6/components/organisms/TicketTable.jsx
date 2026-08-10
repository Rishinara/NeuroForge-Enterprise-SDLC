import TicketRow from '../molecules/TicketRow.jsx';
import EmptyState from '../molecules/EmptyState.jsx';
import { FiInbox } from 'react-icons/fi';

const COLUMNS = ['Ticket ID', 'Title', 'Category', 'Priority', 'Assignee', 'Created', 'Status', ''];

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800">
      {COLUMNS.map((col, i) => (
        <td key={col + i} className="px-4 py-4">
          <div className="skeleton h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

function TicketTable({ tickets, loading, onDeleteRequest }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : tickets.map((ticket) => (
                  <TicketRow key={ticket.id} ticket={ticket} onDeleteRequest={onDeleteRequest} />
                ))}
          </tbody>
        </table>
      </div>
      {!loading && tickets.length === 0 && (
        <EmptyState
          icon={FiInbox}
          title="No tickets match your filters"
          description="Try adjusting your search or filters, or create a new ticket to get started."
        />
      )}
    </div>
  );
}

export default TicketTable;
