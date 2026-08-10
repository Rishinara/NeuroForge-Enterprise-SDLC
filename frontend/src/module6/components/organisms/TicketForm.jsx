import { useState } from 'react';
import { FiPaperclip, FiX } from 'react-icons/fi';

const initialState = { title: '', description: '', reporter: '', attachment: null };

function TicketForm({ onSubmit, submitting }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    else if (form.title.trim().length < 6) next.title = 'Title should be at least 6 characters.';
    if (!form.description.trim()) next.description = 'Description is required.';
    else if (form.description.trim().length < 20) next.description = 'Add a bit more detail (20+ characters) so AI triage is accurate.';
    if (!form.reporter.trim()) next.reporter = 'Reporter name is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    handleChange('attachment', file ? file.name : null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card space-y-5 p-6 sm:p-8">
      <div>
        <label htmlFor="title" className="label-text">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g. Checkout button unresponsive on mobile Safari"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className="input-field"
        />
        {errors.title && (
          <p id="title-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="label-text">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          rows={5}
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the issue, steps to reproduce, and any relevant context. The more detail you give, the more accurate the AI triage will be."
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'description-error' : undefined}
          className="input-field resize-none"
        />
        {errors.description && (
          <p id="description-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {errors.description}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="reporter" className="label-text">
          Reporter <span className="text-red-500">*</span>
        </label>
        <input
          id="reporter"
          type="text"
          value={form.reporter}
          onChange={(e) => handleChange('reporter', e.target.value)}
          placeholder="Your name"
          aria-invalid={Boolean(errors.reporter)}
          aria-describedby={errors.reporter ? 'reporter-error' : undefined}
          className="input-field"
        />
        {errors.reporter && (
          <p id="reporter-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {errors.reporter}
          </p>
        )}
      </div>

      <div>
        <span className="label-text">Attachment (optional)</span>
        {form.attachment ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm dark:border-slate-700">
            <span className="flex items-center gap-2 truncate text-slate-600 dark:text-slate-300">
              <FiPaperclip size={14} /> {form.attachment}
            </span>
            <button type="button" onClick={() => handleChange('attachment', null)} aria-label="Remove attachment">
              <FiX size={14} className="text-slate-400 hover:text-red-500" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="attachment"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
          >
            <FiPaperclip size={16} />
            Click to attach a screenshot or log file
            <input id="attachment" type="file" onChange={handleFile} className="sr-only" />
          </label>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={submitting} className="btn-primary min-w-[160px]">
          {submitting ? 'Submitting…' : 'Submit for AI triage'}
        </button>
      </div>
    </form>
  );
}

export default TicketForm;
