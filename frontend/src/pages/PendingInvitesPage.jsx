import { useState, useEffect } from 'react'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import './workspace.css'

export default function PendingInvitesPage() {
  const { user } = useAuth()
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    if (!user?.orgId) return
    setLoading(true)
    setError('')
    try {
      const res = await orgApi.listInvites(user.orgId)
      setInvites(res.data || [])
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.orgId])

  const handleCancel = async (invite) => {
    if (!confirm(`Are you sure you want to cancel the invite for ${invite.email}?`)) return
    try {
      await orgApi.cancelInvite(user.orgId, invite.id)
      load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div className="wk-page">
      <div className="wk-page-header">
        <div>
          <h1 className="wk-page-title">Pending Invitations</h1>
          <p className="wk-page-subtitle">Manage invitations that have been sent but not yet accepted.</p>
        </div>
      </div>

      {error && <p className="wk-alert wk-alert-error" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="wk-card">
        {loading ? (
          <p className="wk-empty">Loading...</p>
        ) : invites.length === 0 ? (
          <p className="wk-empty">No pending invitations.</p>
        ) : (
          <table className="wk-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Sent Date</th>
                <th>Expires</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 500 }}>{inv.email}</td>
                  <td>{inv.role?.replaceAll('_', ' ')}</td>
                  <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td>{new Date(inv.expiresAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="wk-btn" 
                      style={{ padding: '4px 10px', fontSize: 12, color: 'var(--wk-error)' }}
                      onClick={() => handleCancel(inv)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
