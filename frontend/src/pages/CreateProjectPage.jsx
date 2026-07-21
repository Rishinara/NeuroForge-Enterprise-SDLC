import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectApi } from '../api/projectApi.js'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import './workspace.css'

const STEPS = ['Basics', 'Methodology', 'Tech stack', 'Team', 'Review']

const SAMPLE_MEMBERS = [
  { id: 'm1', name: 'Asha Patel', role: 'PROJECT_MANAGER' },
  { id: 'm2', name: 'Leo Kim', role: 'DEVELOPER' },
  { id: 'm3', name: 'Maya Chen', role: 'QA_TESTER' },
]

export default function CreateProjectPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [members, setMembers] = useState([])

  const [form, setForm] = useState({
    name: '',
    description: '',
    methodology: 'AGILE',
    startDate: '',
    endDate: '',
    techStack: [],
    teamMemberIds: [],
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    orgApi
      .listMembers(user.orgId)
      .then((res) => {
        setMembers(Array.isArray(res.data) ? res.data : SAMPLE_MEMBERS)
      })
      .catch(() => setMembers(SAMPLE_MEMBERS))
  }, [user.orgId])

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

  function toggleMember(id) {
    setForm((f) => ({
      ...f,
      teamMemberIds: f.teamMemberIds.includes(id)
        ? f.teamMemberIds.filter((m) => m !== id)
        : [...f.teamMemberIds, id],
    }))
  }

  function validateStep() {
    if (step === 0 && !form.name.trim()) return 'Project name is required.'
    if (step === 1 && (!form.startDate || !form.endDate)) return 'Start and end dates are required.'
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
    setError('')
    setSubmitting(true)
    try {
      const res = await projectApi.createProject({ ...form, orgId: user.orgId })
      const newId = res?.data?.id
      navigate(newId ? `/projects/${newId}` : '/projects')
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

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
                className="wk-input"
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
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
                      width: 'auto',
                      padding: '9px 16px',
                      background: form.methodology === m ? 'var(--wk-accent)' : '#fff',
                      color: form.methodology === m ? '#fff' : '#334155',
                      border: '1px solid #e2e4ec',
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
              <button type="button" className="wk-btn wk-btn-primary" style={{ width: 'auto', padding: '10px 16px' }} onClick={addTag}>
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.techStack.map((tag) => (
                <span key={tag} style={{ background: '#eef2ff', color: 'var(--wk-accent)', fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wk-accent)', fontWeight: 700 }}>×</button>
                </span>
              ))}
              {form.techStack.length === 0 && <span style={{ fontSize: 12.5, color: 'var(--wk-slate)' }}>No tags added yet.</span>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wk-field">
            <label className="wk-label">Team members</label>
            {members.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--wk-slate)' }}>No members found for this organization.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map((m) => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, padding: '8px 10px', border: '1px solid #eef0f5', borderRadius: 8 }}>
                    <input type="checkbox" checked={form.teamMemberIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
                    {m.name} <span style={{ color: 'var(--wk-slate)', fontSize: 11.5 }}>({m.role.replaceAll('_', ' ')})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div style={{ fontSize: 13.5, lineHeight: 1.8 }}>
            <p><strong>Name:</strong> {form.name || '—'}</p>
            <p><strong>Methodology:</strong> {form.methodology === 'AGILE' ? 'Agile' : 'Waterfall'}</p>
            <p><strong>Dates:</strong> {form.startDate || '—'} → {form.endDate || '—'}</p>
            <p><strong>Tech stack:</strong> {form.techStack.join(', ') || '—'}</p>
            <p><strong>Team size:</strong> {form.teamMemberIds.length} member(s)</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button type="button" className="wk-btn wk-btn-secondary" style={{ width: 'auto', padding: '10px 18px' }} onClick={back} disabled={step === 0}>
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="wk-btn wk-btn-primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={next}>
              Next
            </button>
          ) : (
            <button type="button" className="wk-btn wk-btn-primary" style={{ width: 'auto', padding: '10px 18px' }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create project'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}