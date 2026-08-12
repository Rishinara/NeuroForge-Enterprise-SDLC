import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { specApi } from '../api/specApi.js'
import { projectApi } from '../api/projectApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth, ROLES } from '../context/AuthContext.jsx'
import Can from '../components/Can.jsx'
import StatusPill from '../components/StatusPill.jsx'
import './specs.css'

let idCounter = 0
function newId() {
  idCounter += 1
  return `local-${Date.now()}-${idCounter}`
}

const EMPTY_STORY = () => ({ id: newId(), asA: '', iWant: '', soThat: '', criteria: [''] })

const BLANK_SPEC = {
  id: 'sNew',
  title: '',
  description: '',
  status: 'Draft',
  version: 1,
  userStories: [EMPTY_STORY()],
  functionalRequirements: [''],
  nonFunctionalRequirements: [''],
  versions: [{ version: 1, status: 'Draft', updatedAt: '—', updatedBy: '—' }],
}

const CAN_EDIT_ROLES = [ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN]

export default function SpecEditorPage() {
  const { projectId = 'p1', specId } = useParams()
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const isNew = !specId || specId === 'new'

  const [spec, setSpec] = useState(isNew ? BLANK_SPEC : null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedNote, setSavedNote] = useState('')

  const canEdit = CAN_EDIT_ROLES.includes(role) && spec?.status !== 'Approved'
  const editingLocked = spec?.status === 'Approved'

  useEffect(() => {
    if (projectId && isNaN(Number(projectId))) {
      projectApi.listProjects(user?.orgId)
        .then((res) => {
          const firstProj = res.data?.[0]
          if (firstProj?.id) {
            const newPath = window.location.pathname.replace(projectId, firstProj.id)
            navigate(newPath, { replace: true })
          } else {
            navigate('/projects', { replace: true })
          }
        })
        .catch(() => {
          navigate('/projects', { replace: true })
        })
    }
  }, [projectId, user?.orgId, navigate])

  const load = useCallback(async () => {
    if (isNew || isNaN(Number(projectId))) return
    setLoading(true)
    setError('')
    try {
      const res = await specApi.getSpec(specId)
      setSpec(res.data)
    } catch (err) {
      setError(extractErrorMessage(err))
      setSpec(null)
    } finally {
      setLoading(false)
    }
  }, [specId, isNew, projectId])

  useEffect(() => {
    load()
  }, [load])

  function update(field, value) {
    setSpec((s) => ({ ...s, [field]: value }))
    setSavedNote('')
  }

  function updateStory(storyId, field, value) {
    setSpec((s) => ({
      ...s,
      userStories: s.userStories.map((st) => (st.id === storyId ? { ...st, [field]: value } : st)),
    }))
  }

  function addStory() {
    setSpec((s) => ({ ...s, userStories: [...s.userStories, EMPTY_STORY()] }))
  }

  function removeStory(storyId) {
    setSpec((s) => ({ ...s, userStories: s.userStories.filter((st) => st.id !== storyId) }))
  }

  function updateCriterion(storyId, index, value) {
    setSpec((s) => ({
      ...s,
      userStories: s.userStories.map((st) =>
        st.id === storyId ? { ...st, criteria: st.criteria.map((c, i) => (i === index ? value : c)) } : st
      ),
    }))
  }

  function addCriterion(storyId) {
    setSpec((s) => ({
      ...s,
      userStories: s.userStories.map((st) => (st.id === storyId ? { ...st, criteria: [...st.criteria, ''] } : st)),
    }))
  }

  function removeCriterion(storyId, index) {
    setSpec((s) => ({
      ...s,
      userStories: s.userStories.map((st) =>
        st.id === storyId ? { ...st, criteria: st.criteria.filter((_, i) => i !== index) } : st
      ),
    }))
  }

  function updateListItem(field, index, value) {
    setSpec((s) => ({ ...s, [field]: s[field].map((v, i) => (i === index ? value : v)) }))
  }

  function addListItem(field) {
    setSpec((s) => ({ ...s, [field]: [...s[field], ''] }))
  }

  function removeListItem(field, index) {
    setSpec((s) => ({ ...s, [field]: s[field].filter((_, i) => i !== index) }))
  }

  async function handleSaveDraft() {
    setError('')
    setSaving(true)
    try {
      const payload = {
        title: spec.title || '',
        description: spec.description || '',
        userStories: (spec.userStories || []).map((s) => ({
          id: String(s.id),
          asA: s.asA || '',
          iWant: s.iWant || '',
          soThat: s.soThat || '',
          criteria: (s.criteria || []).filter(Boolean),
        })),
        functionalRequirements: (spec.functionalRequirements || []).filter(Boolean),
        nonFunctionalRequirements: (spec.nonFunctionalRequirements || []).filter(Boolean),
      }
      if (isNew) {
        const res = await specApi.createSpec(projectId, payload)
        navigate(`/projects/${projectId}/specs/${res.data.id}`)
      } else {
        await specApi.updateSpec(specId, payload)
        setSavedNote('Draft saved.')
      }
    } catch (err) {
      setError(extractErrorMessage(err))
      setSavedNote('Saved locally (backend unreachable).')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitForReview() {
    setError('')
    setSaving(true)
    try {
      await specApi.submitForReview(specId)
      setSpec((s) => ({ ...s, status: 'In Review' }))
    } catch (err) {
      setError(extractErrorMessage(err))
      setSpec((s) => ({ ...s, status: 'In Review' }))
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove() {
    setError('')
    setSaving(true)
    try {
      await specApi.approveSpec(specId)
      setSpec((s) => ({ ...s, status: 'Approved' }))
    } catch (err) {
      setError(extractErrorMessage(err))
      setSpec((s) => ({ ...s, status: 'Approved' }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="wk-page"><p className="wk-empty">Loading spec…</p></div>
  }

  if (!spec) {
    return (
      <div className="sp-page">
        <Link to={`/projects/${projectId}/specs`} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm mb-6 w-fit no-underline">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to specs
        </Link>
        <p className="wk-alert wk-alert-error" style={{ marginTop: 12 }}>
          {error || 'This spec could not be found.'}
        </p>
      </div>
    )
  }

  return (
    <div className="sp-page">
      <Link to={`/projects/${projectId}/specs`} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm mb-6 w-fit no-underline">
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to specs
      </Link>

      {error && <p className="wk-alert wk-alert-error" style={{ marginTop: 12 }}>{error}</p>}
      {savedNote && <p className="wk-alert wk-alert-success" style={{ marginTop: 12 }}>{savedNote}</p>}

      <div className="sp-editor-layout">
        <div className="sp-editor-main">
          <div className="wk-page-header">
            <div style={{ flex: 1 }}>
              {canEdit ? (
                <input
                  className="wk-input sp-title-input"
                  value={spec.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Feature title, e.g. CNG slot booking & online payment"
                />
              ) : (
                <h1 className="wk-page-title">{spec.title || 'Untitled spec'}</h1>
              )}
            </div>
            <StatusPill status={spec.status} />
          </div>

          {editingLocked && (
            <p className="wk-alert wk-alert-info">
              This spec is approved and immutable. Editing will start a new version.
            </p>
          )}

          <div className="wk-card">
            <label className="wk-label">Plain-language description</label>
            {canEdit ? (
              <textarea
                className="wk-textarea"
                style={{ width: '100%' }}
                rows={3}
                value={spec.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Describe the feature in plain English…"
              />
            ) : (
              <p className="sp-readonly-text">{spec.description || '—'}</p>
            )}
          </div>

          <div className="wk-card">
            <div className="sp-section-header">
              <h3 className="sp-section-title">User stories</h3>
              <Can roles={CAN_EDIT_ROLES}>
                {canEdit && (
                  <button className="wk-btn wk-btn-secondary" onClick={addStory}>+ Add story</button>
                )}
              </Can>
            </div>

            {spec.userStories.length === 0 ? (
              <p className="wk-empty">No user stories yet.</p>
            ) : (
              spec.userStories.map((story, idx) => (
                <div key={story.id} className="sp-story-card">
                  <div className="sp-story-header">
                    <span className="sp-story-number">US-{idx + 1}</span>
                    {canEdit && spec.userStories.length > 1 && (
                      <button className="wk-btn-danger-text" onClick={() => removeStory(story.id)}>Remove</button>
                    )}
                  </div>

                  {canEdit ? (
                    <div className="sp-story-form">
                      <div className="sp-story-line">
                        <span>As a</span>
                        <input className="wk-input" value={story.asA} onChange={(e) => updateStory(story.id, 'asA', e.target.value)} placeholder="registered user" />
                      </div>
                      <div className="sp-story-line">
                        <span>I want</span>
                        <input className="wk-input" value={story.iWant} onChange={(e) => updateStory(story.id, 'iWant', e.target.value)} placeholder="to book a CNG slot" />
                      </div>
                      <div className="sp-story-line">
                        <span>So that</span>
                        <input className="wk-input" value={story.soThat} onChange={(e) => updateStory(story.id, 'soThat', e.target.value)} placeholder="I avoid waiting in line" />
                      </div>
                    </div>
                  ) : (
                    <p className="sp-readonly-text">
                      As a <strong>{story.asA || '—'}</strong>, I want <strong>{story.iWant || '—'}</strong>, so that <strong>{story.soThat || '—'}</strong>.
                    </p>
                  )}

                  <div className="sp-criteria">
                    <p className="sp-criteria-label">Acceptance criteria</p>
                    {story.criteria.map((c, i) =>
                      canEdit ? (
                        <div key={i} className="sp-criteria-row">
                          <input
                            className="wk-input"
                            value={c}
                            onChange={(e) => updateCriterion(story.id, i, e.target.value)}
                            placeholder="Given… when… then…"
                          />
                          {story.criteria.length > 1 && (
                            <button className="wk-btn-danger-text" onClick={() => removeCriterion(story.id, i)}>×</button>
                          )}
                        </div>
                      ) : (
                        <p key={i} className="sp-criteria-readonly">• {c}</p>
                      )
                    )}
                    {canEdit && (
                      <button className="sp-add-line" onClick={() => addCriterion(story.id)}>+ Add criterion</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <RequirementsBlock
            title="Functional requirements"
            field="functionalRequirements"
            items={spec.functionalRequirements}
            canEdit={canEdit}
            onUpdate={updateListItem}
            onAdd={addListItem}
            onRemove={removeListItem}
          />

          <RequirementsBlock
            title="Non-functional requirements"
            field="nonFunctionalRequirements"
            items={spec.nonFunctionalRequirements}
            canEdit={canEdit}
            onUpdate={updateListItem}
            onAdd={addListItem}
            onRemove={removeListItem}
          />

          <Can roles={CAN_EDIT_ROLES}>
            <div className="sp-actions">
              {spec.status !== 'Approved' && (
                <button className="wk-btn wk-btn-secondary" onClick={handleSaveDraft} disabled={saving}>
                  {saving ? 'Saving…' : 'Save draft'}
                </button>
              )}
              {spec.status === 'Draft' && !isNew && (
                <button className="wk-btn wk-btn-primary" onClick={handleSubmitForReview} disabled={saving}>
                  Submit for review
                </button>
              )}
              {isNew && (
                <button className="wk-btn wk-btn-primary" onClick={handleSaveDraft} disabled={saving}>
                  {saving ? 'Creating…' : 'Create spec (v1)'}
                </button>
              )}
            </div>
          </Can>
          <Can roles={[ROLES.PROJECT_MANAGER, ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN, ROLES.CLIENT]}>
             <div className="sp-actions" style={{ marginTop: 12 }}>
                {spec.status === 'In Review' && (
                  <button className="wk-btn wk-btn-primary" onClick={handleApprove} disabled={saving}>
                    Approve spec
                  </button>
                )}
             </div>
          </Can>
        </div>

        {!isNew && (
          <aside className="sp-sidebar">
            <h3 className="sp-sidebar-title">Version history</h3>
            <div className="sp-version-list">
              {spec.versions?.map((v) => (
                <div key={v.version} className={`sp-version-item ${v.version === spec.version ? 'sp-version-current' : ''}`}>
                  <div className="sp-version-top">
                    <span className="sp-version-tag">v{v.version}</span>
                    <StatusPill status={v.status} />
                  </div>
                  <p className="sp-version-meta">{v.updatedBy} · {v.updatedAt}</p>
                </div>
              ))}
            </div>
            <p className="sp-sidebar-note">
              Approved versions are immutable. Editing an approved spec creates a new draft version.
            </p>
          </aside>
        )}
      </div>
    </div>
  )
}

function RequirementsBlock({ title, field, items, canEdit, onUpdate, onAdd, onRemove }) {
  return (
    <div className="wk-card">
      <div className="sp-section-header">
        <h3 className="sp-section-title">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="wk-empty">None added yet.</p>
      ) : (
        items.map((item, i) =>
          canEdit ? (
            <div key={i} className="sp-criteria-row">
              <input className="wk-input" value={item} onChange={(e) => onUpdate(field, i, e.target.value)} placeholder="The system shall…" />
              {items.length > 1 && <button className="wk-btn-danger-text" onClick={() => onRemove(field, i)}>×</button>}
            </div>
          ) : (
            <p key={i} className="sp-criteria-readonly">• {item}</p>
          )
        )
      )}
      {canEdit && <button className="sp-add-line" onClick={() => onAdd(field)}>+ Add requirement</button>}
    </div>
  )
}