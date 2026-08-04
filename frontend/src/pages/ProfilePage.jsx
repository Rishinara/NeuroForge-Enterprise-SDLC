import { useState, useEffect } from 'react'
import { profileApi } from '../api/profileApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import './workspace.css'

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({ fullName: '', email: '', phoneNumber: '', role: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    setLoading(true)
    profileApi.getProfile()
      .then((res) => {
        setProfile({
          fullName: res.data?.fullName || user?.fullName || '',
          email: res.data?.email || user?.email || '',
          phoneNumber: res.data?.phoneNumber || '',
          role: res.data?.role || user?.role || '',
        })
      })
      .catch((err) => {
        setProfileError(extractErrorMessage(err))
        setProfile({
          fullName: user?.fullName || '',
          email: user?.email || '',
          phoneNumber: '',
          role: user?.role || '',
        })
      })
      .finally(() => setLoading(false))
  }, [user])

  async function handleUpdateProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError('')
    setProfileSuccess('')
    try {
      const res = await profileApi.updateProfile({
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
      })
      setProfileSuccess('Profile updated successfully.')
      if (res.data) {
        setProfile((p) => ({ ...p, fullName: res.data.fullName || p.fullName }))
      }
    } catch (err) {
      setProfileError(extractErrorMessage(err))
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setChangingPassword(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      await profileApi.changePassword(passwordForm)
      setPasswordSuccess('Password changed successfully.')
      setPasswordForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      setPasswordError(extractErrorMessage(err))
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) return <div className="wk-page"><p className="wk-empty">Loading profile…</p></div>

  return (
    <div className="wk-page">
      <div className="wk-page-header">
        <div>
          <h1 className="wk-page-title">User Profile</h1>
          <p className="wk-page-subtitle">Manage your personal details and security credentials.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, maxWidth: 900 }}>
        {/* Profile Information Card */}
        <div className="wk-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Personal Details</h3>
          {profileError && <p className="wk-alert wk-alert-error" style={{ marginBottom: 12 }}>{profileError}</p>}
          {profileSuccess && <p className="wk-alert wk-alert-success" style={{ marginBottom: 12 }}>{profileSuccess}</p>}
          
          <form onSubmit={handleUpdateProfile}>
            <div className="wk-field">
              <label className="wk-label">Full Name *</label>
              <input
                className="wk-input"
                value={profile.fullName}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="wk-field">
              <label className="wk-label">Email (Read-only)</label>
              <input
                className="wk-input"
                value={profile.email}
                disabled
                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
              />
            </div>
            <div className="wk-field">
              <label className="wk-label">Phone Number</label>
              <input
                className="wk-input"
                value={profile.phoneNumber}
                onChange={(e) => setProfile((p) => ({ ...p, phoneNumber: e.target.value }))}
                placeholder="9876543210"
              />
            </div>
            <div className="wk-field">
              <label className="wk-label">Role</label>
              <input
                className="wk-input"
                value={profile.role?.replaceAll('_', ' ')}
                disabled
                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
              />
            </div>
            <button className="wk-btn wk-btn-primary" type="submit" disabled={savingProfile} style={{ marginTop: 10 }}>
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="wk-card">
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>Change Password</h3>
          {passwordError && <p className="wk-alert wk-alert-error" style={{ marginBottom: 12 }}>{passwordError}</p>}
          {passwordSuccess && <p className="wk-alert wk-alert-success" style={{ marginBottom: 12 }}>{passwordSuccess}</p>}

          <form onSubmit={handleChangePassword}>
            <div className="wk-field">
              <label className="wk-label">Current Password *</label>
              <input
                type="password"
                className="wk-input"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="wk-field">
              <label className="wk-label">New Password *</label>
              <input
                type="password"
                className="wk-input"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                required
              />
            </div>
            <button className="wk-btn wk-btn-primary" type="submit" disabled={changingPassword} style={{ marginTop: 10 }}>
              {changingPassword ? 'Updating…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
