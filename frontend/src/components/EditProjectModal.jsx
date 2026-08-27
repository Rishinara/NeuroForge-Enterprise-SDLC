import { useState, useEffect } from 'react'
import { projectApi } from '../api/projectApi.js'
import { orgApi } from '../api/orgApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import { extractErrorMessage } from '../api/client.js'
import Modal from './Modal.jsx'

export default function EditProjectModal({ open, onClose, project, onUpdated }) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [availableTeams, setAvailableTeams] = useState([])

  const [form, setForm] = useState({
    name: '',
    description: '',
    methodology: 'AGILE',
    startDate: '',
    endDate: '',
    status: 'PLANNING',
    health: 'ON_TRACK',
    techStack: [],
    teamMemberIds: [],
    assignedTeamIds: [],
  })

  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (open && project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        methodology: project.methodology || 'AGILE',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        status: project.status || 'PLANNING',
        health: project.health || 'ON_TRACK',
        techStack: project.techStack || [],
        teamMemberIds: project.teamMemberIds || [],
        assignedTeamIds: project.assignedTeams?.map(t => t.id) || [],
      })
      setError('')
      setTagInput('')
      
      if (user?.orgId) {
        orgApi.listTeamsWithMembers(user.orgId).then(res => setAvailableTeams(res.data || []))
      }
    }
  }, [open, project, user?.orgId])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !form.techStack.includes(tag)) {
      update('techStack', [...form.techStack, tag])
    }
    setTagInput('')
  }

  function removeTag(tag) {
    update('techStack', form.techStack.filter((t) => t !== tag))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Project name is required.')
    if (!form.startDate || !form.endDate) return setError('Start and end dates are required.')

    setError('')
    setSubmitting(true)
    try {
      await projectApi.updateProject(project.id, form)
      onUpdated()
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Project" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs">
            {error}
          </div>
        )}
        
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="edit-name">
            Project Name <span className="text-orange-500">*</span>
          </label>
          <input
            id="edit-name"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="edit-desc">
            Description
          </label>
          <textarea
            id="edit-desc"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs resize-y min-h-[80px]"
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Methodology</label>
            <select
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs cursor-pointer"
              value={form.methodology}
              onChange={(e) => update('methodology', e.target.value)}
            >
              <option value="AGILE">Agile (Scrum / Kanban)</option>
              <option value="WATERFALL">Waterfall</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Status</label>
            <select
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs cursor-pointer"
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
            >
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs"
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">End Date</label>
            <input
              type="date"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs"
              value={form.endDate}
              onChange={(e) => update('endDate', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Health Status</label>
          <select
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs cursor-pointer"
            value={form.health}
            onChange={(e) => update('health', e.target.value)}
          >
            <option value="ON_TRACK">On Track (Healthy)</option>
            <option value="AT_RISK">At Risk (Attention Required)</option>
            <option value="DELAYED">Delayed (Escalation Needed)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Tech Stack Tags</label>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none placeholder:text-slate-400"
              placeholder="e.g. React, Spring Boot, PostgreSQL"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button
              type="button"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
              onClick={addTag}
            >
              Add
            </button>
          </div>
          {form.techStack.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-2">
              {form.techStack.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/60"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-orange-400 hover:text-orange-700 font-bold ml-0.5 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Assigned Teams</label>
          <select 
            multiple 
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none min-h-[90px]"
            value={form.assignedTeamIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => Number(option.value))
              update('assignedTeamIds', selected)
            }}
          >
            {availableTeams.map(t => {
              const memberNames = t.members && t.members.length > 0
                ? t.members.map(m => m.fullName || m.name).join(', ')
                : 'No members';
              return (
                <option key={t.id} value={t.id}>
                  {t.name} — ({memberNames})
                </option>
              )
            })}
          </select>
          <p className="text-[11px] text-slate-500">Tip: Hold Ctrl (or Cmd) to select multiple teams.</p>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all active:scale-[0.98]"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-all shadow-xs active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving…</span>
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
