import { useState, useEffect } from 'react'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function EditTeamModal({ open, onClose, team, onUpdated }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [leadId, setLeadId] = useState('')
  
  const [availableMembers, setAvailableMembers] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && team) {
      setName(team.name || '')
      setDescription(team.description || '')
      setLeadId(team.leadId || '')
      
      // Load available members for the lead dropdown
      setAvailableMembers(team.members || [])
    }
  }, [open, team, user?.orgId])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await orgApi.updateTeam(user?.orgId, team.id, {
        name,
        description,
        leadId: leadId ? Number(leadId) : null
      })
      onUpdated()
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="wk-modal-overlay">
      <div className="wk-modal" style={{ maxWidth: 500 }}>
        <h2>Edit Team</h2>
        <button className="wk-modal-close" onClick={onClose}>&times;</button>
        
        {error && <p className="wk-alert wk-alert-error" style={{ marginBottom: 16 }}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div className="wk-field">
            <label className="wk-label">Team Name *</label>
            <input 
              className="wk-input" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="wk-field">
            <label className="wk-label">Description</label>
            <textarea 
              className="wk-input" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={3}
            />
          </div>

          <div className="wk-field">
            <label className="wk-label">Team Lead</label>
            <select 
              className="wk-input" 
              value={leadId} 
              onChange={e => setLeadId(e.target.value)}
            >
              <option value="">-- No Lead Assigned --</option>
              {availableMembers.map(m => (
                <option key={m.id} value={m.id}>{m.fullName} ({m.email})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button type="button" className="wk-btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="wk-btn wk-btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
