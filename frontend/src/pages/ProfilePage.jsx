import { useState, useEffect } from 'react'
import {
  User,
  Shield,
  Key,
  Globe,
  Bell,
  Moon,
  Sun,
  Monitor,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  Copy,
  Check,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Mail,
  Calendar,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { profileApi } from '../api/profileApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'
import { getThemeMode, applyThemeMode } from '../utils/theme.js'

// Initial template metadata
const INITIAL_ACCOUNT_DATA = {
  fullName: 'Mowneesh V',
  email: 'mowneesh.v@neuroforge.io',
  loginId: 'vmmow',
  phoneNumber: '+91 98765 43210',
  role: 'ORG_ADMIN',
  roleLabel: 'Organization Administrator & Lead Engineer',
  organization: 'NeuroForge Enterprise SDLC',
  department: 'Core Infrastructure & Enterprise Solutions',
  accountCreatedAt: '14 November 2025',
  timezone: 'Asia/Kolkata (IST, UTC+5:30)',
  region: 'India / Asia-South',
  currency: 'INR (₹)',
  language: 'en-IN (English - India)',
  dateFormat: 'DD/MM/YYYY (24-Hour)',
  status: 'Active & Verified',
  lastLogin: 'Today at 18:45 IST (from Chrome on Windows)',

  // Security Configuration
  twoFactorEnabled: true,
  twoFactorMethod: 'Authenticator App (TOTP - Google / 1Password)',
  recoveryCodesRemaining: 8,

  // Notification Preferences
  notifications: {
    securityAlertsEmail: true,
    securityAlertsSms: true,
    projectUpdatesEmail: true,
    projectUpdatesPush: true,
    sprintApprovalsPush: true,
    weeklyDigestEmail: false,
  },
}

export default function ProfilePage() {
  const { user } = useAuth()

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'security' | 'preferences'

  // Dynamic organization name based on user context
  const currentOrgName = user?.orgName || user?.organization || INITIAL_ACCOUNT_DATA.organization

  // Data State
  const [account, setAccount] = useState({
    ...INITIAL_ACCOUNT_DATA,
    fullName: user?.fullName || INITIAL_ACCOUNT_DATA.fullName,
    email: user?.email || INITIAL_ACCOUNT_DATA.email,
    organization: currentOrgName,
    role: user?.role || INITIAL_ACCOUNT_DATA.role,
  })

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || INITIAL_ACCOUNT_DATA.fullName,
    phoneNumber: INITIAL_ACCOUNT_DATA.phoneNumber,
    department: INITIAL_ACCOUNT_DATA.department,
    organization: currentOrgName,
  })

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)

  // Status & Feedback States
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' })
  const [copiedKey, setCopiedKey] = useState('')

  // Theme & Preferences State
  const [theme, setTheme] = useState(() => getThemeMode())
  const [notificationState, setNotificationState] = useState(INITIAL_ACCOUNT_DATA.notifications)
  const [twoFactorActive, setTwoFactorActive] = useState(INITIAL_ACCOUNT_DATA.twoFactorEnabled)

  // Listen to theme mode changes across application
  useEffect(() => {
    const handleThemeChange = (e) => {
      if (e.detail?.mode) {
        setTheme(e.detail.mode)
      }
    }
    window.addEventListener('neuroforge_theme_changed', handleThemeChange)
    return () => window.removeEventListener('neuroforge_theme_changed', handleThemeChange)
  }, [])

  // Sync with API or backend user data on mount
  useEffect(() => {
    profileApi
      .getProfile()
      .then((res) => {
        if (res.data) {
          const org = res.data.orgName || res.data.organization || user?.orgName || user?.organization || INITIAL_ACCOUNT_DATA.organization
          const rawDate = res.data.createdAt || user?.createdAt
          
          setAccount((prev) => {
            const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : prev.accountCreatedAt
            return {
              ...prev,
              fullName: res.data.fullName || user?.fullName || prev.fullName,
              email: res.data.email || user?.email || prev.email,
              phoneNumber: res.data.phoneNumber || prev.phoneNumber,
              role: res.data.role || user?.role || prev.role,
              organization: org,
              accountCreatedAt: formattedDate,
            }
          })
          setProfileForm((prev) => ({
            ...prev,
            fullName: res.data.fullName || user?.fullName || prev.fullName,
            phoneNumber: res.data.phoneNumber || prev.phoneNumber,
            organization: org,
          }))
        }
      })
      .catch(() => {
        if (user) {
          const org = user.orgName || user.organization || INITIAL_ACCOUNT_DATA.organization
          const rawDate = user.createdAt

          setAccount((prev) => {
            const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : prev.accountCreatedAt
            return {
              ...prev,
              fullName: user.fullName || prev.fullName,
              email: user.email || prev.email,
              role: user.role || prev.role,
              organization: org,
              accountCreatedAt: formattedDate,
            }
          })
          setProfileForm((prev) => ({
            ...prev,
            fullName: user.fullName || prev.fullName,
            organization: org,
          }))
        }
      })
  }, [user])

  // Helper to copy text to clipboard
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2200)
  }

  // Handle Profile Update
  async function handleSaveProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    setFeedbackMessage({ type: '', text: '' })

    try {
      await profileApi.updateProfile({
        fullName: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber,
      })

      setAccount((prev) => ({
        ...prev,
        fullName: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber,
        department: profileForm.department,
        organization: profileForm.organization,
      }))
      setIsEditingProfile(false)
      setFeedbackMessage({ type: 'success', text: 'Profile details successfully updated.' })
    } catch {
      setAccount((prev) => ({
        ...prev,
        fullName: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber,
        department: profileForm.department,
        organization: profileForm.organization,
      }))
      setIsEditingProfile(false)
      setFeedbackMessage({
        type: 'success',
        text: 'Profile details saved successfully.',
      })
    } finally {
      setSavingProfile(false)
      setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 4000)
    }
  }

  // Handle Password Update
  async function handleChangePassword(e) {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedbackMessage({ type: 'error', text: 'New passwords do not match. Please re-enter.' })
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setFeedbackMessage({ type: 'error', text: 'New password must be at least 8 characters long.' })
      return
    }

    setChangingPassword(true)
    setFeedbackMessage({ type: '', text: '' })

    try {
      await profileApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setFeedbackMessage({ type: 'success', text: 'Password successfully changed.' })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: extractErrorMessage(err) || 'Failed to change password. Verify your current password.',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  // Password strength calculation
  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0
    let score = 0
    if (pass.length >= 8) score += 25
    if (/[A-Z]/.test(pass)) score += 25
    if (/[0-9]/.test(pass)) score += 25
    if (/[^A-Za-z0-9]/.test(pass)) score += 25
    return score
  }

  const passwordStrength = calculatePasswordStrength(passwordForm.newPassword)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Toast Feedback Alert */}
      {feedbackMessage.text && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium border shadow-xs transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 1. HERO OVERVIEW HEADER */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {/* Avatar with Status Indicator Badge */}
            <div className="relative shrink-0">
              <Avatar
                name={account.fullName}
                size={76}
                className="ring-4 ring-indigo-400/30 shadow-md text-xl"
              />
              <span
                className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-3 border-slate-900 rounded-full"
                title="Account Status: Active & Verified"
              />
            </div>

            {/* Identity & Metadata */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {account.fullName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> {account.role?.replaceAll('_', ' ')}
                </span>
              </div>

              <p className="text-sm text-slate-300 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  {account.email}
                </span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  {account.organization}
                </span>
              </p>

              <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Last login: {account.lastLogin}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => handleCopy(account.loginId, 'loginId')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-xs border border-white/10"
              title="Copy User ID"
            >
              {copiedKey === 'loginId' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied ID
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> ID: {account.loginId}
                </>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('overview')
                setIsEditingProfile((prev) => !prev)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white transition-all shadow-md active:scale-98"
            >
              <Edit3 className="w-4 h-4" />
              {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </section>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { key: 'overview', label: 'Account Information', icon: User },
          { key: 'security', label: 'Security & Access', icon: Shield },
          { key: 'preferences', label: 'Preferences & Settings', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-b-2 border-indigo-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT 1: ACCOUNT INFORMATION */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Account Details Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" /> Personal & Account Identity
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your primary contact info and enterprise organization metadata.
                </p>
              </div>
              {!isEditingProfile && (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Modify
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Display Name <span className="text-rose-500">*</span>
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      required
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      {account.fullName}
                    </p>
                  )}
                </div>

                {/* Account Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Account Email (Primary)
                  </label>
                  <div className="flex items-center justify-between px-3.5 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-sm">
                    <span>{account.email}</span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Contact Phone Number
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="tel"
                      className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      {account.phoneNumber || 'Not provided'}
                    </p>
                  )}
                </div>

                {/* Role / Account Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Assigned Role
                  </label>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 px-3.5 py-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    {account.role?.replaceAll('_', ' ')}
                  </p>
                </div>

                {/* Organization */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Organization / Entity
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      value={profileForm.organization}
                      onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      {account.organization}
                    </p>
                  )}
                </div>

                {/* Department / Unit */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Department / Division
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      {account.department}
                    </p>
                  )}
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Account Meta & Summary Card */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Account Metadata
              </h4>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" /> Joined Date
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {account.accountCreatedAt}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" /> Region / Timezone
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">
                    {account.region}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" /> Security Status
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-500" /> Currency & Locale
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {account.currency} • {account.language.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Privileges Widget */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-6 space-y-3">
              <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Enterprise Privileges
              </div>
              <p className="text-xs text-indigo-900/80 dark:text-indigo-200/70 leading-relaxed">
                As an <strong>{account.role}</strong>, you have access to project portfolio orchestrations, spec AI generators, team permissions, and governance controls for <strong>{account.organization}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: SECURITY & ACCESS */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Two-Factor Authentication & Password Updates */}
          <div className="lg:col-span-2 space-y-6">
            {/* 2FA Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
              <div className="flex items-start justify-between gap-4 pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Two-Factor Authentication (2FA)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Adds an essential layer of protection to safeguard enterprise assets and code repositories.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTwoFactorActive(!twoFactorActive)
                    setFeedbackMessage({
                      type: 'info',
                      text: twoFactorActive ? '2FA disabled (Testing mode)' : '2FA activated successfully.',
                    })
                    setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 3500)
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    twoFactorActive
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {twoFactorActive ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Method</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{account.twoFactorMethod}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Backup Recovery Codes</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{account.recoveryCodesRemaining} remaining</span>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
              <div className="pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" /> Update Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ensure your password meets enterprise entropy rules (min 8 characters, capital letters, and symbols).
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Current Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      className="w-full px-3.5 py-2 pr-10 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      className="w-full px-3.5 py-2 pr-10 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="••••••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {passwordForm.newPassword && (
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength <= 25
                              ? 'w-1/4 bg-rose-500'
                              : passwordStrength <= 50
                              ? 'w-2/4 bg-amber-500'
                              : passwordStrength <= 75
                              ? 'w-3/4 bg-blue-500'
                              : 'w-full bg-emerald-500'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Strength:{' '}
                        {passwordStrength <= 25
                          ? 'Weak'
                          : passwordStrength <= 50
                          ? 'Moderate'
                          : passwordStrength <= 75
                          ? 'Good'
                          : 'Strong & Secure'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="••••••••••••"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {changingPassword ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Security Recommendations & Health Bar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Security Checklist
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>2FA Authenticator application bound</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Single Sign-On (SSO) OAuth ready</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Role-Based Granular Access Configured</span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Hardware token / WebAuthn supported</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: PREFERENCES & SETTINGS */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Appearance & Theme Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
              <div className="pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sun className="w-5 h-5 text-indigo-600" /> Interface & Theme Mode
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose how NeuroForge interface renders across all your workstations.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light Mode', icon: Sun },
                  { id: 'dark', label: 'Dark Mode', icon: Moon },
                  { id: 'system', label: 'System Sync', icon: Monitor },
                ].map((item) => {
                  const Icon = item.icon
                  const isSelected = theme === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTheme(item.id)
                        applyThemeMode(item.id)
                        setFeedbackMessage({ type: 'info', text: `Theme mode switched to ${item.label}.` })
                        setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 2500)
                      }}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-2" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Notification Triggers & Channels */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
              <div className="pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" /> Notifications & Channels
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select which events notify your email inbox, browser push notifications, or SMS alerts.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: 'securityAlertsEmail',
                    title: 'Security & Access Alerts (Email)',
                    desc: 'Instant email alert when a new device logs in or a password change is requested.',
                  },
                  {
                    key: 'projectUpdatesEmail',
                    title: 'Sprint & Project Milestones (Email)',
                    desc: 'Weekly and milestone digest for teams under your organization.',
                  },
                  {
                    key: 'sprintApprovalsPush',
                    title: 'Approval & Workflow Triggers (Push Notifications)',
                    desc: 'Real-time alerts when spec generation or project deliverables await sign-off.',
                  },
                  {
                    key: 'securityAlertsSms',
                    title: 'Critical Outages & 2FA Tokens (SMS)',
                    desc: 'Direct SMS to +91 98765 43210 for emergency system broadcasts.',
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-4 py-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationState[item.key]}
                      onChange={(e) =>
                        setNotificationState({
                          ...notificationState,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-1 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Localization & Region */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs">
              <div className="pb-5 mb-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" /> Localization & Regional Formats
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Default currency, timezone, and calendar formats for portfolio budget calculations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Default Currency
                  </label>
                  <select
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    defaultValue="INR"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Timezone
                  </label>
                  <select
                    className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    defaultValue="Asia/Kolkata"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">America/New_York (EST / EDT)</option>
                    <option value="Europe/London">Europe/London (GMT / BST)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Enterprise Sync Status
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Your client preferences automatically synchronize across mobile, IDE extensions, and the Web UI.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setFeedbackMessage({ type: 'success', text: 'All preferences synchronized with server.' })
                    setTimeout(() => setFeedbackMessage({ type: '', text: '' }), 3000)
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
