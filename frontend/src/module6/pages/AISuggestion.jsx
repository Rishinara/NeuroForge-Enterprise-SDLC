import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiEdit3 } from 'react-icons/fi';
import AppLayout from '../layouts/AppLayout.jsx';
import AISuggestionCard from '../components/organisms/AISuggestionCard.jsx';
import LoadingSpinner from '../components/atoms/LoadingSpinner.jsx';
import EmptyState from '../components/molecules/EmptyState.jsx';
import { useTickets } from '../context/TicketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

function AISuggestion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, fetchTickets, getTicket, acceptSuggestion, initialized } = useTickets();
  const { showToast } = useToast();
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!initialized) fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const ticket = getTicket(id);

  async function handleAccept() {
    setAccepting(true);
    try {
      await acceptSuggestion(id);
      showToast('Suggestion accepted. Ticket assigned.', { type: 'success' });
      navigate(`/tickets/${id}`);
    } catch (err) {
      showToast(err.message || 'Failed to accept suggestion.', { type: 'error' });
    } finally {
      setAccepting(false);
    }
  }

  return (
    <AppLayout title="AI suggestion">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-4 px-2">
          <FiArrowLeft size={16} /> Back
        </button>

        {loading && !ticket ? (
          <div className="card flex justify-center p-16">
            <LoadingSpinner label="Loading AI suggestion…" />
          </div>
        ) : !ticket ? (
          <div className="card">
            <EmptyState title="Ticket not found" description="This ticket may have been deleted." />
          </div>
        ) : (
          <>
            <AISuggestionCard ticket={ticket} />
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => navigate(`/tickets/${id}/edit`)} className="btn-secondary">
                <FiEdit3 size={16} /> Modify suggestion
              </button>
              <button onClick={handleAccept} disabled={accepting} className="btn-primary">
                <FiCheck size={16} /> {accepting ? 'Accepting…' : 'Accept suggestion'}
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default AISuggestion;
