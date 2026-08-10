import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import TicketForm from '../components/organisms/TicketForm.jsx';
import { useTickets } from '../context/TicketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

function CreateTicket() {
  const navigate = useNavigate();
  const { addTicket } = useTickets();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      const created = await addTicket(payload);
      showToast('Ticket submitted. AI triage is ready to review.', { type: 'success' });
      navigate(`/tickets/${created.id}/suggestions`);
    } catch (err) {
      showToast(err.message || 'Failed to create ticket.', { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout title="Create ticket">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Report a new issue</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Submit the details below and the AI triage engine will suggest a category, priority and assignee.
          </p>
        </div>
        <TicketForm onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </AppLayout>
  );
}

export default CreateTicket;
