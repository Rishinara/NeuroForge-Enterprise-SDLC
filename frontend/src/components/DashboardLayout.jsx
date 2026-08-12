import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
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

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('neuroforge_sidebar_width')
    return saved ? parseInt(saved, 10) : 256
  })
  const [isResizing, setIsResizing] = useState(false)

  const startResizing = useCallback((e) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback((e) => {
    if (isResizing) {
      const newWidth = Math.min(Math.max(e.clientX, 200), 450)
      setSidebarWidth(newWidth)
      localStorage.setItem('neuroforge_sidebar_width', newWidth)
    }
  }, [isResizing])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', resize)
      document.addEventListener('mouseup', stopResizing)
    } else {
      document.removeEventListener('mousemove', resize)
      document.removeEventListener('mouseup', stopResizing)
    }
    return () => {
      document.removeEventListener('mousemove', resize)
      document.removeEventListener('mouseup', stopResizing)
    }
  }, [isResizing, resize, stopResizing])

  return (
    <div className="flex min-h-screen bg-canvas font-sans" style={{ cursor: isResizing ? 'col-resize' : 'auto' }}>
      <Sidebar width={sidebarWidth} onMouseDown={startResizing} isResizing={isResizing} />
      <div 
        className="flex-1 min-w-0 flex flex-col min-h-screen transition-none"
        style={{ marginLeft: sidebarWidth }}
      >
        <Topbar title={title} subtitle={subtitle} />
        
        <main className="flex-1 flex flex-col overflow-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}