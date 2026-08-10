import { FiSearch, FiX } from 'react-icons/fi';

function SearchBar({ value, onChange, placeholder = 'Search by title, ID or assignee…' }) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <FiSearch
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        size={16}
        aria-hidden="true"
      />
      <input
        type="search"
        role="searchbox"
        aria-label="Search tickets"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <FiX size={14} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
