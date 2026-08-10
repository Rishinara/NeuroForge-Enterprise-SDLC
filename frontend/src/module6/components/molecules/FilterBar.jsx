import { CATEGORIES, PRIORITIES, STATUSES } from '../../utils/constants.js';

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="input-field cursor-pointer py-2 pr-8 text-sm"
      >
        <option value="All">All {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterBar({ filters, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ticket filters">
      <Select label="Categories" value={filters.category} onChange={(v) => onChange('category', v)} options={CATEGORIES} />
      <Select label="Priorities" value={filters.priority} onChange={(v) => onChange('priority', v)} options={PRIORITIES} />
      <Select label="Statuses" value={filters.status} onChange={(v) => onChange('status', v)} options={STATUSES} />
    </div>
  );
}

export default FilterBar;
