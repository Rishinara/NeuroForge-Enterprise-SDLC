import { useState, useEffect } from 'react'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'

export default function RecentActivities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Only Org Admins and Super Admins should see this
    if (!user?.orgId || (user?.role !== ROLES.ORG_ADMIN && user?.role !== ROLES.SUPER_ADMIN)) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const res = await orgApi.listActivities(user.orgId)
        setActivities(res.data || [])
      } catch (err) {
        setError(extractErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) return <p className="wk-empty">Loading activities...</p>
  if (user?.role !== ROLES.ORG_ADMIN && user?.role !== ROLES.SUPER_ADMIN) return null
  if (error) return <p className="wk-alert wk-alert-error">{error}</p>

  if (activities.length === 0) {
    return <p className="wk-empty">No recent activities.</p>
  }

  return (
    <div className="wk-card" style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Recent Activities</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activities.map(act => (
          <div key={act.id} style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{act.action}</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {new Date(act.createdAt).toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>{act.details}</p>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 4, margin: 0 }}>By: {act.actorEmail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
