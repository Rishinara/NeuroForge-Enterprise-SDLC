import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/workspace-theme.css'
const savedTheme = localStorage.getItem('neuroforge_theme') || 'classic'
if (savedTheme !== 'classic') {
  document.documentElement.classList.add(`theme-${savedTheme}`)
}
const savedMode = localStorage.getItem('neuroforge_theme_mode') || 'light'
if (savedMode === 'dark') {
  document.documentElement.classList.add('dark')
}
const savedDensity = localStorage.getItem('neuroforge_density') || 'comfortable'
if (savedDensity === 'compact') {
  document.documentElement.classList.add('density-compact')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)