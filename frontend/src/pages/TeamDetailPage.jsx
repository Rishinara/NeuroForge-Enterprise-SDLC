import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Can from '../components/Can.jsx'
import EditTeamModal from '../components/EditTeamModal.jsx'
import './workspace.css'

export default function TeamDetailPage() {
  const { teamId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editOpen, setEditOpen] = useState(false)

  const load = async () => {
    if (!teamId || isNaN(Number(teamId))) return
    setLoading(true)
    setError('')
    try {
      const res = await orgApi.getTeam(user?.orgId, teamId)
      setTeam(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [teamId, user?.orgId])

  if (loading || !team) {
    return <div className="wk-page"><p className="wk-empty">Loading team...</p></div>
  }

  return (
    <div className="wk-page">
      <Link to="/org/teams" className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm mb-4 w-fit no-underline">
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to teams
      </Link>

      {error && <p className="wk-alert wk-alert-error" style={{ marginTop: 12 }}>{error}</p>}

      <div className="wk-page-header" style={{ marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 className="wk-page-title">{team.name}</h1>
          <p className="wk-page-subtitle">
            Lead: {team.leadName || 'Unassigned'} • Created: {new Date(team.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <Can roles={[ROLES.ORG_ADMIN]}>
          <button className="wk-btn wk-btn-secondary" onClick={() => setEditOpen(true)}>
            Edit Team
          </button>
        </Can>
      </div>

      <div className="wk-card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Description</h3>
        <p style={{ fontSize: 14, color: '#475569' }}>{team.description || 'No description provided.'}</p>
      </div>

      <div className="wk-card">
        <h3 style={{ fontSize: 16, marginBottom: 12 }}>Members ({team.memberCount})</h3>
        {!team.members || team.members.length === 0 ? (
          <p className="wk-empty">No members assigned to this team.</p>
        ) : (
          <table className="wk-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th></tr>
            </thead>
            <tbody>
              {team.members.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 500 }}>{m.fullName}</td>
                  <td>{m.email}</td>
                  <td>{m.role?.replaceAll('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editOpen && (
        <EditTeamModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          team={team}
          onUpdated={load}
        />
      )}
    </div>
  )
}
