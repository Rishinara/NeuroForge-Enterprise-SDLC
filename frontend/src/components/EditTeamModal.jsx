import { useState, useEffect } from 'react'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from './Modal.jsx'

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
    <Modal open={open} onClose={onClose} title="Edit Team Details" maxWidth="max-w-md">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Team Name <span className="text-orange-500">*</span>
          </label>
          <input 
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs"
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
          <textarea 
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs resize-y min-h-[80px]"
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Team Lead</label>
          <select 
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs cursor-pointer"
            value={leadId} 
            onChange={e => setLeadId(e.target.value)}
          >
            <option value="">-- No Lead Assigned --</option>
            {availableMembers.map(m => (
              <option key={m.id} value={m.id}>{m.fullName} ({m.email})</option>
            ))}
          </select>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all active:scale-[0.98]"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
