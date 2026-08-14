import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import { profileApi } from '../api/profileApi.js'
import { extractErrorMessage } from '../api/client.js'

export default function SuperAdminSettingsPage() {
  const { user, logout, role } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('appearance')

  // Theme state
  const [themeMode, setThemeMode] = useState(
    () => localStorage.getItem('neuroforge_theme_mode') || 'light'
  )

  // Account preferences state
  const [accountForm, setAccountForm] = useState({
    language: localStorage.getItem('nf_pref_language') || 'English',
    timezone: localStorage.getItem('nf_pref_timezone') || 'Asia/Kolkata',
    dateFormat: localStorage.getItem('nf_pref_date_format') || 'DD/MM/YYYY',
  })

  // Notifications state
  const [notifications, setNotifications] = useState({
    inApp: localStorage.getItem('nf_pref_notif_in_app') !== 'false',
    teamInvites: localStorage.getItem('nf_pref_notif_team_invites') !== 'false',
    orgUpdates: localStorage.getItem('nf_pref_notif_org_updates') !== 'false',
    securityNotifs: localStorage.getItem('nf_pref_notif_security') !== 'false',
    emailNotifs: localStorage.getItem('nf_pref_notif_email') !== 'false',
  })

  // Security state - Password change
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Access control
  if (role !== ROLES.SUPER_ADMIN && user?.role !== ROLES.SUPER_ADMIN) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        Access Denied. Only Super Admins can access this page.
      </div>
    )
  }

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

  // Handle saving of form-based tabs
  const handleSaveChanges = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (activeTab === 'account') {
        localStorage.setItem('nf_pref_language', accountForm.language)
        localStorage.setItem('nf_pref_timezone', accountForm.timezone)
        localStorage.setItem('nf_pref_date_format', accountForm.dateFormat)
        setSuccessMsg('Account preferences saved successfully.')
      } else if (activeTab === 'notifications') {
        localStorage.setItem('nf_pref_notif_in_app', String(notifications.inApp))
        localStorage.setItem('nf_pref_notif_team_invites', String(notifications.teamInvites))
        localStorage.setItem('nf_pref_notif_org_updates', String(notifications.orgUpdates))
        localStorage.setItem('nf_pref_notif_security', String(notifications.securityNotifs))
        localStorage.setItem('nf_pref_notif_email', String(notifications.emailNotifs))
        setSuccessMsg('Notification preferences saved successfully.')
      } else if (activeTab === 'security') {
        if (!passwordForm.oldPassword || !passwordForm.newPassword) {
          throw new Error('Please fill in both current and new password fields.')
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          throw new Error('New password and confirm password do not match.')
        }
        if (passwordForm.newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters long.')
        }
        await profileApi.changePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        })
        setSuccessMsg('Password changed successfully.')
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      }
    } catch (err) {
      setErrorMsg(extractErrorMessage(err) || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-5">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--wk-ink)' }}>Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your account and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <nav className="space-y-1">
              {[
                { id: 'appearance', label: 'Appearance', icon: 'Appearance' },
                { id: 'account', label: 'Account Preferences', icon: 'Preferences' },
                { id: 'notifications', label: 'Notifications', icon: 'Notifications' },
                { id: 'security', label: 'Security', icon: 'Security' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setErrorMsg('')
                    setSuccessMsg('')
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Small Profile Summary card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profile</h4>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{role?.replaceAll('_', ' ')}</p>
              <p className="text-xs text-slate-400 truncate mt-1">{user?.email}</p>
            </div>
            <Link
              to="/profile"
              className="block w-full text-center py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              View Profile
            </Link>
          </div>
        </div>

        {/* Tab Panels */}
        <div className="md:col-span-3">
          <form onSubmit={handleSaveChanges} className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              
              {/* Appearance Panel */}
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

              {/* Account Preferences Panel */}
              {activeTab === 'account' && (
                <div>
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Account Preferences</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure language, date formatting, and regional parameters.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="lang">Language</label>
                        <select
                          id="lang"
                          value={accountForm.language}
                          onChange={(e) => setAccountForm({ ...accountForm, language: e.target.value })}
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
                          value={accountForm.timezone}
                          onChange={(e) => setAccountForm({ ...accountForm, timezone: e.target.value })}
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
                          value={accountForm.dateFormat}
                          onChange={(e) => setAccountForm({ ...accountForm, dateFormat: e.target.value })}
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

              {/* Notifications Panel */}
              {activeTab === 'notifications' && (
                <div>
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Notification Preferences</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure where and how you want to be notified.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { key: 'inApp', label: 'In-App Notifications', desc: 'Recieve updates inside the NeuroForge dashboard.' },
                      { key: 'teamInvites', label: 'Team Invitations', desc: 'Get notified when invited to a workspace team.' },
                      { key: 'orgUpdates', label: 'Organization Updates', desc: 'Updates regarding your tenants and administration.' },
                      { key: 'securityNotifs', label: 'Security Notifications', desc: 'Alerts regarding critical account modifications.' },
                      { key: 'emailNotifs', label: 'Email Notifications', desc: 'Dispatch invite and update notifications via email.' },
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

              {/* Security Panel */}
              {activeTab === 'security' && (
                <div>
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">Security Settings</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure credentials and update your password.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-4 max-w-sm">
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="oldPassword">Current Password</label>
                        <input
                          id="oldPassword"
                          type="password"
                          value={passwordForm.oldPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                          className="w-full text-sm border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800 dark:text-white"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="newPassword">New Password</label>
                        <input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full text-sm border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800 dark:text-white"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full text-sm border-slate-300 dark:border-slate-700 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white dark:bg-slate-800 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-900 text-sm shadow-sm">
                ⚠️ {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 p-4 rounded-xl border border-green-200 dark:border-green-900 text-sm shadow-sm">
                ✅ {successMsg}
              </div>
            )}

            {/* Action Buttons for non-appearance tabs */}
            {activeTab !== 'appearance' && (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('')
                    setSuccessMsg('')
                    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
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
