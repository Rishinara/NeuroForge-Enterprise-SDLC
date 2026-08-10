import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiPaperclip, FiTrash2 } from 'react-icons/fi';
import { useState } from 'react';
import AppLayout from '../layouts/AppLayout.jsx';
import Timeline from '../components/organisms/Timeline.jsx';
import Avatar from '../components/atoms/Avatar.jsx';
import PriorityBadge from '../components/atoms/PriorityBadge.jsx';
import StatusBadge from '../components/atoms/StatusBadge.jsx';
import ReasonCard from '../components/molecules/ReasonCard.jsx';
import ActivityCard from '../components/molecules/ActivityCard.jsx';
import ConfidenceGauge from '../components/atoms/ConfidenceGauge.jsx';
import LoadingSpinner from '../components/atoms/LoadingSpinner.jsx';
import EmptyState from '../components/molecules/EmptyState.jsx';
import DeleteModal from '../components/organisms/DeleteModal.jsx';
import { useTickets } from '../context/TicketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { currentUser } from '../data/currentUser.js';
import { formatDate } from '../utils/formatters.js';

function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, fetchTickets, getTicket, removeTicket, initialized } = useTickets();
  const { showToast } = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!initialized) fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const ticket = getTicket(id);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await removeTicket(id);
      showToast(`Ticket #${id} deleted.`, { type: 'success' });
      navigate('/dashboard');
    } catch (err) {
      showToast(err.message || 'Failed to delete ticket.', { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading && !ticket) {
    return (
      <AppLayout title="Ticket details">
        <div className="card flex justify-center p-16">
          <LoadingSpinner label="Loading ticket…" />
        </div>
      </AppLayout>
    );
  }

  if (!ticket) {
    return (
      <AppLayout title="Ticket details">
        <div className="card">
          <EmptyState title="Ticket not found" description="This ticket may have been deleted or the link is incorrect." />
        </div>
      </AppLayout>
    );
  }

  const activity = [
    { type: 'created', title: 'Ticket created', timestamp: ticket.createdAt, actor: ticket.reporter },
    { type: 'suggested', title: `AI suggested ${ticket.assignee} · ${ticket.category}`, timestamp: ticket.createdAt, actor: 'AI Triage Engine' },
    ...(ticket.status !== 'Open' ? [{ type: 'accepted', title: `Status set to ${ticket.status}`, timestamp: ticket.createdAt, actor: currentUser.name }] : []),
  ];

  return (
    <AppLayout title={`Ticket #${ticket.id}`}>
      <div className="mx-auto max-w-5xl">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost mb-4 px-2">
          <FiArrowLeft size={16} /> Back to dashboard
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="card p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-slate-400">#{ticket.id}</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight">{ticket.title}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/tickets/${ticket.id}/edit`)} className="btn-secondary" aria-label="Edit ticket">
                    <FiEdit2 size={15} /> Edit
                  </button>
                  <button onClick={() => setConfirmingDelete(true)} className="btn-danger" aria-label="Delete ticket">
                    <FiTrash2 size={15} /> Delete
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <Timeline status={ticket.status} />
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 dark:border-slate-800 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Reporter</p>
                  <p className="mt-1 text-sm font-semibold">{ticket.reporter}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Created</p>
                  <p className="mt-1 text-sm font-semibold">{formatDate(ticket.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Category</p>
                  <p className="mt-1 text-sm font-semibold">{ticket.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Story points</p>
                  <p className="mt-1 text-sm font-semibold">{ticket.storyPoints} pts</p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Description</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{ticket.description}</p>
                {ticket.attachment && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <FiPaperclip size={13} /> {ticket.attachment}
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6 sm:p-8">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Activity log</h3>
              <div className="space-y-4">
                {activity.map((entry, i) => (
                  <ActivityCard key={i} {...entry} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">AI suggestion</h3>
              </div>
              <div className="mt-4 flex justify-center">
                <ConfidenceGauge confidence={ticket.confidence} size={104} />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/40">
                <Avatar name={ticket.assignee} size="sm" />
                <div>
                  <p className="text-sm font-semibold">{ticket.assignee}</p>
                  <p className="text-xs text-slate-400">Suggested assignee</p>
                </div>
              </div>
              <div className="mt-4">
                <ReasonCard reason={ticket.reason} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteModal
        ticket={confirmingDelete ? ticket : null}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </AppLayout>
  );
}

export default TicketDetails;
