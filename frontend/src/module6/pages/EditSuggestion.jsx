import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import LoadingSpinner from '../components/atoms/LoadingSpinner.jsx';
import EmptyState from '../components/molecules/EmptyState.jsx';
import { useTickets } from '../context/TicketContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { CATEGORIES, PRIORITIES } from '../utils/constants.js';
import { teamMembers } from '../data/teamMembers.js';

function EditSuggestion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, fetchTickets, getTicket, editTicket, initialized } = useTickets();
  const { showToast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialized) fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const ticket = getTicket(id);

  useEffect(() => {
    if (ticket && !form) {
      setForm({
        category: ticket.category,
        priority: ticket.priority,
        storyPoints: ticket.storyPoints,
        assignee: ticket.assignee,
        reason: ticket.reason,
      });
    }
  }, [ticket, form]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await editTicket(id, { ...form, storyPoints: Number(form.storyPoints) });
      showToast('Suggestion updated successfully.', { type: 'success' });
      navigate(`/tickets/${id}`);
    } catch (err) {
      showToast(err.message || 'Failed to save changes.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout title="Edit suggestion">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Override AI suggestion</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ticket #{id}</p>
        </div>

        {loading && !ticket ? (
          <div className="card flex justify-center p-16">
            <LoadingSpinner label="Loading ticket…" />
          </div>
        ) : !ticket || !form ? (
          <div className="card">
            <EmptyState title="Ticket not found" description="This ticket may have been deleted." />
          </div>
        ) : (
          <form onSubmit={handleSave} className="card space-y-5 p-6 sm:p-8">
            <div>
              <label htmlFor="category" className="label-text">
                Category
              </label>
              <select id="category" value={form.category} onChange={(e) => update('category', e.target.value)} className="input-field">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="label-text">
                Priority
              </label>
              <select id="priority" value={form.priority} onChange={(e) => update('priority', e.target.value)} className="input-field">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="storyPoints" className="label-text">
                Story points
              </label>
              <input
                id="storyPoints"
                type="number"
                min={1}
                max={21}
                value={form.storyPoints}
                onChange={(e) => update('storyPoints', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="assignee" className="label-text">
                Assignee
              </label>
              <select id="assignee" value={form.assignee} onChange={(e) => update('assignee', e.target.value)} className="input-field">
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="reason" className="label-text">
                Reason
              </label>
              <textarea
                id="reason"
                rows={4}
                value={form.reason}
                onChange={(e) => update('reason', e.target.value)}
                className="input-field resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary min-w-[140px]">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}

export default EditSuggestion;
