import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiFolder, FiPlus, FiUserCheck, FiZapOff } from 'react-icons/fi';
import AppLayout from '../layouts/AppLayout.jsx';
import StatsCard from '../components/molecules/StatsCard.jsx';
import SearchBar from '../components/molecules/SearchBar.jsx';
import FilterBar from '../components/molecules/FilterBar.jsx';
import TicketTable from '../components/organisms/TicketTable.jsx';
import Pagination from '../components/molecules/Pagination.jsx';
import DeleteModal from '../components/organisms/DeleteModal.jsx';
import { useTickets } from '../context/TicketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useTicketFilters } from '../hooks/useTicketFilters.js';

function Dashboard() {
  const navigate = useNavigate();
  const { tickets, loading, fetchTickets, removeTicket } = useTickets();
  const { showToast } = useToast();
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { search, setSearch, filters, updateFilter, page, setPage, totalPages, pageSize, results, totalResults } =
    useTicketFilters(tickets);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'Open').length,
    assigned: tickets.filter((t) => t.status === 'Assigned').length,
    closed: tickets.filter((t) => t.status === 'Closed').length,
    highPriority: tickets.filter((t) => t.priority === 'High' || t.priority === 'Critical').length,
  };

  async function handleConfirmDelete() {
    if (!ticketToDelete) return;
    setIsDeleting(true);
    try {
      await removeTicket(ticketToDelete.id);
      showToast(`Ticket #${ticketToDelete.id} deleted.`, { type: 'success' });
      setTicketToDelete(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete ticket.', { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AppLayout title="Dashboard">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Ticket triage overview</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              AI-assisted categorization, prioritization and assignment for incoming issues.
            </p>
          </div>
          <button onClick={() => navigate('/tickets/new')} className="btn-primary shrink-0">
            <FiPlus size={16} /> New ticket
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatsCard label="Total tickets" value={stats.total} icon={FiFolder} accent="brand" />
          <StatsCard label="Open" value={stats.open} icon={FiZapOff} accent="sky" />
          <StatsCard label="Assigned" value={stats.assigned} icon={FiUserCheck} accent="violet" />
          <StatsCard label="Closed" value={stats.closed} icon={FiCheckCircle} accent="slate" />
          <StatsCard label="High priority" value={stats.highPriority} icon={FiZapOff} accent="red" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar value={search} onChange={setSearch} />
          <FilterBar filters={filters} onChange={updateFilter} />
        </div>

        <TicketTable tickets={results} loading={loading} onDeleteRequest={setTicketToDelete} />

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalResults={totalResults} pageSize={pageSize} />
      </div>

      <DeleteModal
        ticket={ticketToDelete}
        onCancel={() => setTicketToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </AppLayout>
  );
}

export default Dashboard;
