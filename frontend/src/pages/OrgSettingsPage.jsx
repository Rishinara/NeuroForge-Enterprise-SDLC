import { useState, useEffect, useCallback } from 'react'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import UnassignedOrgNotice from '../components/UnassignedOrgNotice.jsx'
import './workspace.css'

export default function OrgSettingsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const [form, setForm] = useState({ name: '', description: '', supportEmail: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    if (!user?.orgId) {
      setLoading(false)
      setForm({ name: user?.orgName || '', description: '', supportEmail: '' })
      return
    }
    setLoading(true)
    try {
      const res = await orgApi.getOrgSettings(user.orgId)
      setForm(res.data)
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

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  if (!isSuperAdmin && !user?.orgId) {
    return <UnassignedOrgNotice />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      await orgApi.updateOrgSettings(user.orgId, form)
      setSaved(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="wk-page"><p className="wk-empty">Loading settings…</p></div>

  return (
    <div className="wk-page">
      <div className="wk-page-header">
        <div>
          <h1 className="wk-page-title">Organization settings</h1>
          <p className="wk-page-subtitle">Manage how your org appears across the platform.</p>
        </div>
      </div>

      <div className="wk-card" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit} noValidate>
          {error && <p className="nf-alert nf-alert-error">{error}</p>}
          {saved && <p className="nf-alert nf-alert-success">Settings saved.</p>}

          <div className="nf-field">
            <label className="nf-label" htmlFor="name">Organization name</label>
            <input id="name" className="nf-input" value={form.name} onChange={update('name')} />
          </div>

          <div className="nf-field">
            <label className="nf-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="nf-input"
              rows={3}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
              value={form.description}
              onChange={update('description')}
            />
          </div>

          <div className="nf-field">
            <label className="nf-label" htmlFor="supportEmail">Support email</label>
            <input id="supportEmail" type="email" className="nf-input" value={form.supportEmail} onChange={update('supportEmail')} />
          </div>

          <button className="nf-btn nf-btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}