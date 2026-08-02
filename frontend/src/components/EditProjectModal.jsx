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
        orgApi.listTeams(user.orgId).then(res => setAvailableTeams(res.data || []))
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
    <Modal open={open} onClose={onClose} title="Edit Project">
      <form onSubmit={handleSubmit}>
        {error && <p className="nf-alert nf-alert-error" style={{ marginBottom: 16 }}>{error}</p>}
        
        <div className="nf-field">
          <label className="nf-label" htmlFor="edit-name">Project name</label>
          <input
            id="edit-name"
            className="nf-input"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </div>

        <div className="nf-field">
          <label className="nf-label" htmlFor="edit-desc">Description</label>
          <textarea
            id="edit-desc"
            className="nf-input"
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        <div className="nf-row-2">
          <div className="nf-field">
            <label className="nf-label">Methodology</label>
            <select className="nf-select" value={form.methodology} onChange={(e) => update('methodology', e.target.value)}>
              <option value="AGILE">Agile (Scrum / Kanban)</option>
              <option value="WATERFALL">Waterfall</option>
            </select>
          </div>
          <div className="nf-field">
            <label className="nf-label">Status</label>
            <select className="nf-select" value={form.status} onChange={(e) => update('status', e.target.value)}>
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="nf-row-2">
          <div className="nf-field">
            <label className="nf-label">Start Date</label>
            <input type="date" className="nf-input" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
          </div>
          <div className="nf-field">
            <label className="nf-label">End Date</label>
            <input type="date" className="nf-input" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
          </div>
        </div>

        <div className="nf-field">
          <label className="nf-label">Health</label>
          <select className="nf-select" value={form.health} onChange={(e) => update('health', e.target.value)}>
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk</option>
            <option value="DELAYED">Delayed</option>
          </select>
        </div>

        <div className="nf-field">
          <label className="nf-label">Tech stack</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="nf-input"
              placeholder="e.g. React, Java, PostgreSQL"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button type="button" className="nf-btn nf-btn-secondary" onClick={addTag}>Add</button>
          </div>
          {form.techStack.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {form.techStack.map((t) => (
                <span key={t} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t}
                  <button type="button" onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="nf-field" style={{ marginTop: 16 }}>
          <label className="nf-label">Assigned Teams</label>
          <select 
            multiple 
            className="nf-select" 
            style={{ minHeight: 100 }}
            value={form.assignedTeamIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => Number(option.value))
              update('assignedTeamIds', selected)
            }}
          >
            {availableTeams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Hold Ctrl/Cmd to select multiple teams.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button type="button" onClick={onClose} className="nf-btn nf-btn-secondary" disabled={submitting}>Cancel</button>
          <button type="submit" className="nf-btn nf-btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
