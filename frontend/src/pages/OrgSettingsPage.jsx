import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import UnassignedOrgNotice from '../components/UnassignedOrgNotice.jsx'
import './workspace.css'

export default function OrgSettingsPage() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('org_info')

  // Organization Information form
  const [form, setForm] = useState({ name: '', description: '', supportEmail: '' })
  
  // Theme state
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem('neuroforge_theme_mode') || 'light'
  )

  // Preferences state
  const [prefForm, setPrefForm] = useState({
    language: localStorage.getItem('nf_org_pref_language') || 'English',
    timezone: localStorage.getItem('nf_org_pref_timezone') || 'Asia/Kolkata',
    dateFormat: localStorage.getItem('nf_org_pref_date_format') || 'DD/MM/YYYY',
  })

  // Notifications state
  const [notifications, setNotifications] = useState({
    orgUpdates: localStorage.getItem('nf_org_pref_notif_updates') !== 'false',
    approvals: localStorage.getItem('nf_org_pref_notif_approvals') !== 'false',
    invites: localStorage.getItem('nf_org_pref_notif_invites') !== 'false',
    security: localStorage.getItem('nf_org_pref_notif_security') !== 'false',
    email: localStorage.getItem('nf_org_pref_notif_email') !== 'false',
  })

  const [counts, setCounts] = useState({ members: 0, pendingRequests: 0, pendingInvites: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Access check
  if (role !== ROLES.ORG_ADMIN && user?.role !== ROLES.ORG_ADMIN) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        Access Denied. Only Organization Admins can access this page.
      </div>
    )
  }

  const load = useCallback(async () => {
    if (!user?.orgId) {
      setLoading(false)
      setForm({ name: user?.orgName || '', description: '', supportEmail: '' })
      return
    }
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const [settingsRes, membersRes, requestsRes, pendingUsersRes, invitesRes] = await Promise.all([
        orgApi.getOrgSettings(user.orgId),
        orgApi.listMembers(user.orgId).catch(() => ({ data: [] })),
        orgApi.getJoinRequests(user.orgId).catch(() => ({ data: [] })),
        orgApi.getPendingUsers(user.orgId).catch(() => ({ data: [] })),
        orgApi.listInvites(user.orgId).catch(() => ({ data: [] }))
      ])
      
      setForm(settingsRes.data)
      setCounts({
        members: Array.isArray(membersRes.data) ? membersRes.data.length : 0,
        pendingRequests: (Array.isArray(requestsRes.data) ? requestsRes.data.length : 0) + 
                         (Array.isArray(pendingUsersRes.data) ? pendingUsersRes.data.length : 0),
        pendingInvites: Array.isArray(invitesRes.data) ? invitesRes.data.length : 0,
      })
    } catch (err) {
      setError(extractErrorMessage(err))
      setForm({ name: user?.orgName || '', description: '', supportEmail: '' })
    } finally {
      setLoading(false)
    }
  }, [user?.orgId, user?.orgName])

  useEffect(() => {
    load()
  }, [load])

  // Handle immediate theme switching
  const handleThemeChange = (mode) => {
    setThemeMode(mode)
    localStorage.setItem('neuroforge_theme_mode', mode)
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Submit Handler
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setSaving(true)

    try {
      if (activeTab === 'org_info') {
        await orgApi.updateOrgSettings(user.orgId, form)
        setSuccessMsg('Organization information saved successfully.')
      } else if (activeTab === 'preferences') {
        localStorage.setItem('nf_org_pref_language', prefForm.language)
        localStorage.setItem('nf_org_pref_timezone', prefForm.timezone)
        localStorage.setItem('nf_org_pref_date_format', prefForm.dateFormat)
        setSuccessMsg('Organization preferences saved successfully.')
      } else if (activeTab === 'notifications') {
        localStorage.setItem('nf_org_pref_notif_updates', String(notifications.orgUpdates))
        localStorage.setItem('nf_org_pref_notif_approvals', String(notifications.approvals))
        localStorage.setItem('nf_org_pref_notif_invites', String(notifications.invites))
        localStorage.setItem('nf_org_pref_notif_security', String(notifications.security))
        localStorage.setItem('nf_org_pref_notif_email', String(notifications.email))
        setSuccessMsg('Notification configurations saved successfully.')
      }
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="wk-page"><p className="wk-empty">Loading settings…</p></div>
  }

  return (
    <div className="w-full px-6 lg:px-10 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white" style={{ color: 'var(--wk-ink)' }}>Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your organization's configuration, access, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <nav className="space-y-1">
              {[
                { id: 'org_info', label: '🏢 Organization' },
                { id: 'members_access', label: '👥 Members & Access' },
                { id: 'notifications', label: '🔔 Notifications' },
                { id: 'security', label: '🔐 Security' },
                { id: 'appearance', label: '🎨 Appearance' },
                { id: 'preferences', label: '⚙ Preferences' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setError('')
                    setSuccessMsg('')
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                    activeTab === tab.id
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Panels */}
        <div className="lg:col-span-9">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              
              {/* Organization Info */}
              {activeTab === 'org_info' && (
                <div>
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Organization Information</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage basic information about your organization.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Organization ID</label>
                        <input className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-900/50 text-slate-500 cursor-not-allowed" value={`ORG-${user?.orgId || '001'}`} readOnly />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Status</label>
                        <div className="flex items-center gap-2 h-9 px-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="org-name">Organization Name</label>
                      <input id="org-name" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="org-desc">Organization Description</label>
                      <textarea id="org-desc" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 min-h-[100px]" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="org-email">Support Email</label>
                      <input id="org-email" type="email" className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500" value={form.supportEmail || ''} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}

              {/* Members & Access */}
              {activeTab === 'members_access' && (
                <div>
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Members & Access</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review membership stats and perform quick administrative actions.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                        <span className="block text-2xl font-bold text-slate-900 dark:text-white">{counts.members}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Members</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                        <span className="block text-2xl font-bold text-slate-900 dark:text-white">{counts.pendingRequests}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Pending Requests</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-center">
                        <span className="block text-2xl font-bold text-slate-900 dark:text-white">{counts.pendingInvites}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Pending Invitations</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Link to="/org/teams" className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 no-underline">
                        Manage Members & Teams
                      </Link>
                      <Link to="/dashboard" className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 no-underline">
                        View Pending Approvals
                      </Link>
                      <Link to="/org/invites" className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 no-underline">
                        Manage Invitations
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div>
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Notifications</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure where and how organization admins want to receive updates.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { key: 'orgUpdates', label: 'Organization Updates', desc: 'Receive notifications about organization level modifications.' },
                      { key: 'approvals', label: 'Member Approval Requests', desc: 'Get notified when new users request to join.' },
                      { key: 'invites', label: 'Team Invitations & Notifications', desc: 'Get updates on accepted or rejected team invites.' },
                      { key: 'security', label: 'Security Alerts', desc: 'Notify admins of password changes or credential updates.' },
                      { key: 'email', label: 'Dispatch Email Notifications', desc: 'Send organization notification summaries via email.' },
                    ].map((notif) => (
                      <div key={notif.key} className="flex items-start justify-between py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                        <div className="space-y-0.5">
                          <label className="text-sm font-semibold text-slate-900 dark:text-white" htmlFor={notif.key}>{notif.label}</label>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{notif.desc}</p>
                        </div>
                        <input
                          id={notif.key}
                          type="checkbox"
                          checked={notifications[notif.key]}
                          onChange={(e) => setNotifications({ ...notifications, [notif.key]: e.target.checked })}
                          className="w-4 h-4 text-orange-600 border-slate-300 dark:border-slate-700 rounded focus:ring-orange-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security */}
              {activeTab === 'security' && (
                <div>
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Security Settings</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure credentials and update your password.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Security configurations are managed directly inside your user profile.</p>
                    <Link to="/profile" className="inline-flex px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors no-underline">
                      Change Profile Password
                    </Link>
                  </div>
                </div>
              )}

              {/* Appearance */}
              {activeTab === 'appearance' && (
                <div>
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Appearance</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose how NeuroForge looks on your screen.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Theme</span>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleThemeChange('light')}
                          className={`flex items-center gap-2 px-4 py-3 border rounded-xl font-semibold text-sm transition-all ${
                            themeMode === 'light'
                              ? 'border-orange-600 bg-orange-50/40 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/25'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>☀️ Light</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleThemeChange('dark')}
                          className={`flex items-center gap-2 px-4 py-3 border rounded-xl font-semibold text-sm transition-all ${
                            themeMode === 'dark'
                              ? 'border-orange-600 bg-orange-50/40 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/25'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>🌙 Dark</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences */}
              {activeTab === 'preferences' && (
                <div>
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Organization Preferences</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure language, date formatting, and regional parameters.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="lang">Language</label>
                        <select
                          id="lang"
                          value={prefForm.language}
                          onChange={(e) => setPrefForm({ ...prefForm, language: e.target.value })}
                          className="w-full text-sm border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800 dark:text-white"
                        >
                          <option value="English">English</option>
                          <option value="Spanish">Español</option>
                          <option value="German">Deutsch</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="tz">Timezone</label>
                        <select
                          id="tz"
                          value={prefForm.timezone}
                          onChange={(e) => setPrefForm({ ...prefForm, timezone: e.target.value })}
                          className="w-full text-sm border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800 dark:text-white"
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                          <option value="UTC">Coordinated Universal Time (UTC)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="df">Date Format</label>
                        <select
                          id="df"
                          value={prefForm.dateFormat}
                          onChange={(e) => setPrefForm({ ...prefForm, dateFormat: e.target.value })}
                          className="w-full text-sm border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800 dark:text-white"
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-900 text-sm shadow-sm">
                ⚠️ {error}
              </div>
            )}
            
            {successMsg && (
              <div className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 p-4 rounded-xl border border-green-200 dark:border-green-900 text-sm shadow-sm">
                ✅ {successMsg}
              </div>
            )}

            {/* Action Buttons for non-appearance/security tabs */}
            {activeTab !== 'appearance' && activeTab !== 'security' && activeTab !== 'members_access' && (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setSuccessMsg('')
                    load()
                  }}
                  className="px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-75"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}