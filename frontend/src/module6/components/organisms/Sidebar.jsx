import { NavLink } from 'react-router-dom';
import { FiGrid, FiPlusSquare, FiX, FiZap, FiCpu } from 'react-icons/fi';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { to: '/tickets/new', label: 'New ticket', icon: FiPlusSquare },
  { to: '/ai-assistant', label: 'AI Assistant', icon: FiCpu },
];

function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-100 bg-panel-light transition-transform dark:border-slate-800 dark:bg-panel-dark lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white shadow-glow">
              <FiZap size={16} aria-hidden="true" />
            </span>
            <span className="font-bold tracking-tight">Triage AI</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <FiX size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Primary">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <p className="text-xs text-slate-400">AI Ticket Triage v1.0</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
