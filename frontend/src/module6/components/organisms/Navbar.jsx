import { FiMenu, FiMoon, FiSun } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext.jsx';
import Avatar from '../atoms/Avatar.jsx';
import { currentUser } from '../../data/currentUser.js';

function Navbar({ onMenuClick, title = 'Dashboard' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-100 bg-panel-light/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-panel-dark/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <FiMenu size={20} />
        </button>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
        <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 dark:border-slate-700 sm:flex">
          <Avatar name={currentUser.name} size="sm" />
          <div className="leading-tight">
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-slate-400">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
