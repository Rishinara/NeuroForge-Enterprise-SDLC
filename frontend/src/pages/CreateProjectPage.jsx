import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectApi } from '../api/projectApi.js'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import './workspace.css'

const STEPS = ['Basics', 'Methodology', 'Tech stack', 'Team', 'Milestones', 'Review']

export default function CreateProjectPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [teams, setTeams] = useState([])
  const [teamsError, setTeamsError] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    methodology: 'AGILE',
    startDate: '',
    endDate: '',
    techStackTags: [],
    teamId: '',
    milestones: [], // [{ name, dueDate }]
  })
  const [tagInput, setTagInput] = useState('')
  const [milestoneDraft, setMilestoneDraft] = useState({ name: '', dueDate: '' })

  useEffect(() => {
    orgApi
      .listTeams(user.orgId)
      .then((res) => {
        setTeams(Array.isArray(res.data) ? res.data : [])
      })
      .catch((err) => {
        setTeamsError(extractErrorMessage(err))
        setTeams([])
      })
  }, [user.orgId])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !form.techStackTags.includes(tag)) {
      update('techStackTags', [...form.techStackTags, tag])
    }
    setTagInput('')
  }

  function removeTag(tag) {
    update('techStackTags', form.techStackTags.filter((t) => t !== tag))
  }

  function addMilestone() {
    if (!milestoneDraft.name.trim() || !milestoneDraft.dueDate) return
    setForm((f) => ({ ...f, milestones: [...f.milestones, { ...milestoneDraft }] }))
    setMilestoneDraft({ name: '', dueDate: '' })
  }

  function removeMilestone(index) {
    setForm((f) => ({ ...f, milestones: f.milestones.filter((_, i) => i !== index) }))
  }

  function validateStep() {
    if (step === 0 && !form.name.trim()) return 'Project name is required.'
    if (step === 1 && (!form.startDate || !form.endDate)) return 'Start and end dates are required.'
    if (step === 3 && !form.teamId) return 'Select a team — the backend requires one and populates members from it.'
    return ''
  }

  function next() {
    const v = validateStep()
    if (v) return setError(v)
    setError('')
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    const v = validateStep()
    if (v) return setError(v)

    setError('')
    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        methodology: form.methodology,
        startDate: form.startDate,
        endDate: form.endDate,
        techStack: form.techStackTags,
        teamMemberIds: [],
      }
      if (form.teamId) {
        try {
          const membersRes = await orgApi.listMembers(user.orgId)
          const teamMembers = membersRes.data.filter(m => 
            m.teams?.includes(teams.find(t => String(t.id) === String(form.teamId))?.name)
          )
          payload.teamMemberIds = teamMembers.map(m => m.id)
        } catch { /* fallback: empty */ }
      }
      const res = await projectApi.createProject(user.orgId, payload)
      navigate(`/projects/${res.data.id}`)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTeam = teams.find((t) => String(t.id) === String(form.teamId))

  return (
    <div className="wk-page">
      <div className="wk-page-header">
        <div>
          <h1 className="wk-page-title">New project</h1>
          <p className="wk-page-subtitle">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>
      </div>

      <div className="wk-card" style={{ maxWidth: 560 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                background: i <= step ? 'var(--wk-accent)' : '#eef0f5',
              }}
            />
          ))}
        </div>

        {error && <p className="wk-alert wk-alert-error">{error}</p>}

        {step === 0 && (
          <>
            <div className="wk-field">
              <label className="wk-label" htmlFor="name">Project name</label>
              <input id="name" className="wk-input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Checkout Revamp" />
            </div>
            <div className="wk-field">
              <label className="wk-label" htmlFor="description">Description</label>
              <textarea
                id="description"
                className="wk-textarea"
                style={{ width: '100%' }}
                rows={4}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="What is this project about?"
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="wk-field">
              <label className="wk-label">Methodology</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['AGILE', 'WATERFALL'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update('methodology', m)}
                    className="wk-btn"
                    style={{
                      background: form.methodology === m ? 'var(--wk-accent)' : '#fff',
                      color: form.methodology === m ? '#fff' : '#334155',
                      border: '1px solid var(--wk-border)',
                    }}
                  >
                    {m === 'AGILE' ? 'Agile' : 'Waterfall'}
                  </button>
                ))}
              </div>
            </div>
            <div className="wk-row-2">
              <div className="wk-field">
                <label className="wk-label" htmlFor="startDate">Start date</label>
                <input id="startDate" type="date" className="wk-input" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
              </div>
              <div className="wk-field">
                <label className="wk-label" htmlFor="endDate">End date</label>
                <input id="endDate" type="date" className="wk-input" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="wk-field">
            <label className="wk-label">Tech stack tags</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                className="wk-input"
                placeholder="e.g. React"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              />
              <button type="button" className="wk-btn wk-btn-primary" onClick={addTag}>Add</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.techStackTags.map((tag) => (
                <span key={tag} style={{ background: 'var(--wk-accent-soft)', color: 'var(--wk-accent)', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wk-accent)', fontWeight: 700 }}>×</button>
                </span>
              ))}
              {form.techStackTags.length === 0 && <span style={{ fontSize: 12.5, color: 'var(--wk-slate)' }}>No tags added yet.</span>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wk-field">
            <label className="wk-label">Team</label>
            <p style={{ fontSize: 12, color: 'var(--wk-slate)', margin: '0 0 10px' }}>
              The backend assigns project members automatically from everyone on the selected team —
              there's no separate member picker.
            </p>
            {teamsError && <p className="wk-alert wk-alert-error">{teamsError}</p>}
            {teams.length === 0 && !teamsError ? (
              <p className="wk-empty">Loading teams…</p>
            ) : teams.length === 0 ? (
              <p className="wk-empty">No teams found for your organization. Create one under Teams & Members first.</p>
            ) : (
              <select className="wk-select" value={form.teamId} onChange={(e) => update('teamId', e.target.value)}>
                <option value="" disabled>Select a team…</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.memberCount} members)</option>
                ))}
              </select>
            )}
            {selectedTeam && (
              <p style={{ fontSize: 12, color: 'var(--wk-slate)', marginTop: 8 }}>
                All {selectedTeam.memberCount} member(s) of "{selectedTeam.name}" will be added to this project.
              </p>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="wk-field">
            <label className="wk-label">Milestones (optional)</label>
            <div className="wk-row-2" style={{ marginBottom: 10 }}>
              <input
                className="wk-input"
                placeholder="Milestone name"
                value={milestoneDraft.name}
                onChange={(e) => setMilestoneDraft((m) => ({ ...m, name: e.target.value }))}
              />
              <input
                type="date"
                className="wk-input"
                value={milestoneDraft.dueDate}
                onChange={(e) => setMilestoneDraft((m) => ({ ...m, dueDate: e.target.value }))}
              />
            </div>
            <button type="button" className="wk-btn wk-btn-secondary" onClick={addMilestone} style={{ marginBottom: 14 }}>
              + Add milestone
            </button>

            {form.milestones.length === 0 ? (
              <p className="wk-empty">No milestones added.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.milestones.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid var(--wk-border)', borderRadius: 8, fontSize: 13 }}>
                    <span>{m.name} — {m.dueDate}</span>
                    <button type="button" className="wk-btn-danger-text" onClick={() => removeMilestone(i)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div style={{ fontSize: 13.5, lineHeight: 1.8 }}>
            <p><strong>Name:</strong> {form.name || '—'}</p>
            <p><strong>Methodology:</strong> {form.methodology === 'AGILE' ? 'Agile' : 'Waterfall'}</p>
            <p><strong>Dates:</strong> {form.startDate || '—'} → {form.endDate || '—'}</p>
            <p><strong>Tech stack:</strong> {form.techStackTags.join(', ') || '—'}</p>
            <p><strong>Team:</strong> {selectedTeam?.name || '—'}</p>
            <p><strong>Milestones:</strong> {form.milestones.length}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button type="button" className="wk-btn wk-btn-secondary" onClick={back} disabled={step === 0}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="wk-btn wk-btn-primary" onClick={next}>
              Next
            </button>
          ) : (
            <button type="button" className="wk-btn wk-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create project'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}