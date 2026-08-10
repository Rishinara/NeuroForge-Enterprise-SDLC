import { useState } from 'react';
import Sidebar from '../components/organisms/Sidebar.jsx';
import Navbar from '../components/organisms/Navbar.jsx';

function AppLayout({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-light dark:bg-surface-dark">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
