import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

const TITLES = [
  { match: /^\/dashboard/, title: 'Dashboard', subtitle: 'Your overview at a glance' },
  { match: /^\/projects\/new/, title: 'New project', subtitle: 'Set up a project in a few steps' },
  { match: /^\/projects\/[^/]+$/, title: 'Project details', subtitle: null },
  { match: /^\/projects/, title: 'Projects', subtitle: 'Portfolio health across your organization' },
  { match: /^\/org\/teams/, title: 'Teams & Members', subtitle: 'Manage who has access and what they can do' },
  { match: /^\/org\/settings/, title: 'Organization Settings', subtitle: 'Configure how your org appears' },
]

function useRouteTitle() {
  const { pathname } = useLocation()
  const found = TITLES.find((t) => t.match.test(pathname))
  return found || { title: 'NeuroForge', subtitle: null }
}

export default function DashboardLayout() {
  const { title, subtitle } = useRouteTitle()

  return (
    <div className="flex min-h-screen bg-canvas font-sans">
      <Sidebar />
      <div className="flex-1 min-w-0 ml-64 flex flex-col min-h-screen">
        <Topbar title={title} subtitle={subtitle} />
        
        <main className="flex-1 flex flex-col overflow-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}