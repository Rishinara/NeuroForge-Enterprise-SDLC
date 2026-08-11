import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectApi } from '../api/projectApi.js'
import { orgApi } from '../api/orgApi.js'
import { extractErrorMessage } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import './workspace.css'

const STEPS = ['Basics', 'Methodology', 'Tech stack', 'Team', 'Review']

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
      .listMembers(user?.orgId)
      .then((res) => {
        const allMembers = Array.isArray(res.data) ? res.data : []
        setMembers(allMembers.filter(m => m.role !== 'ORG_ADMIN'))
      })
      .catch(() => setMembers([]))
  }, [user?.orgId])

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
      const numericOrgId = Number(user?.orgId)
      const payload = {
        ...form,
        orgId: isNaN(numericOrgId) ? null : numericOrgId,
        teamMemberIds: form.teamMemberIds.map((id) => Number(id)).filter((id) => !isNaN(id)),
      }
      const res = await projectApi.createProject(payload)
      const newId = res?.data?.id
      navigate(newId ? `/projects/${newId}` : '/projects')
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* Left Column: Context & Navigation */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New project</h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Create a new workspace for your team. You'll be able to track tasks, specs, bugs, and milestones all in one place.
            </p>
          </div>
          
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Setup Progress</h3>
            <ul className="space-y-6">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-4 relative">
                  {i !== STEPS.length - 1 && (
                    <div className={`absolute left-4 top-10 bottom-[-16px] w-0.5 ${i < step ? 'bg-orange-500' : 'bg-slate-100'}`} />
                  )}
                  <div 
                    className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-colors ${
                      i < step ? 'bg-orange-500 text-white' 
                      : i === step ? 'bg-orange-100 text-orange-700 border-2 border-orange-500' 
                      : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {i < step ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <div>
                    <span className={`text-sm font-semibold ${i === step ? 'text-slate-900' : i < step ? 'text-slate-700' : 'text-slate-400'}`}>
                      {s}
                    </span>
                    {i === step && (
                      <p className="text-xs text-orange-600 mt-0.5 font-medium">In progress</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Mobile progress indicator */}
          <div className="lg:hidden bg-white rounded-xl shadow-sm border border-slate-200 p-4">
             <div className="flex justify-between items-center mb-2">
               <span className="text-sm font-semibold text-slate-900">{STEPS[step]}</span>
               <span className="text-xs font-medium text-slate-500">Step {step + 1} of {STEPS.length}</span>
             </div>
             <div className="flex gap-2">
               {STEPS.map((s, i) => (
                 <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-orange-500' : 'bg-slate-100'}`} />
               ))}
             </div>
          </div>
        </div>

        {/* Right Column: Form Content */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[500px]">
            <div className="p-6 sm:p-8 flex-1">
              
              {/* Form Title */}
              <div className="mb-8 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">{STEPS[step]}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {step === 0 && "Provide the basic details and identity for your project."}
                  {step === 1 && "Choose how your team works and set the timeline."}
                  {step === 2 && "What technologies are you using to build this?"}
                  {step === 3 && "Select the people who will collaborate on this workspace."}
                  {step === 4 && "Review everything before finalizing your new workspace."}
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm">
                  {error}
                </div>
              )}

              {/* Step 0: Basics */}
              {step === 0 && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="name">
                      Project name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 transition-colors"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="e.g. Checkout Revamp"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="description">
                      Description
                    </label>
                    <textarea
                      id="description"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 transition-colors"
                      rows={5}
                      style={{ resize: 'vertical' }}
                      value={form.description}
                      onChange={(e) => update('description', e.target.value)}
                      placeholder="What is this project about? What are the main goals?"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Methodology & Dates */}
              {step === 1 && (
                <div className="space-y-8 max-w-2xl">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Methodology
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {['AGILE', 'WATERFALL'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => update('methodology', m)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            form.methodology === m
                              ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`text-sm font-bold mb-1 ${form.methodology === m ? 'text-orange-700' : 'text-slate-800'}`}>
                            {m === 'AGILE' ? 'Agile' : 'Waterfall'}
                          </div>
                          <div className={`text-xs ${form.methodology === m ? 'text-orange-600' : 'text-slate-500'}`}>
                            {m === 'AGILE' ? 'Iterative sprints, backlog, flexible.' : 'Sequential, structured, milestones.'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="startDate">
                        Start date <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="startDate"
                        type="date"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500"
                        value={form.startDate}
                        onChange={(e) => update('startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="endDate">
                        End date <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="endDate"
                        type="date"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500"
                        value={form.endDate}
                        onChange={(e) => update('endDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Tech Stack */}
              {step === 2 && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Tech stack tags
                    </label>
                    <div className="flex gap-3 mb-4">
                      <input
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500"
                        placeholder="e.g. React, Node.js, Postgres"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                        onClick={addTag}
                      >
                        Add Tag
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                      {form.techStack.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md shadow-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="w-4 h-4 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {form.techStack.length === 0 && (
                        <span className="text-sm text-slate-400 m-auto">No technologies added yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Team */}
              {step === 3 && (
                <div className="space-y-4">
                  {members.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      <p className="text-sm text-slate-500">No eligible members found in this organization.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2">
                      {members.map((m) => {
                        const isChecked = form.teamMemberIds.includes(m.id);
                        return (
                          <label
                            key={m.id}
                            className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-orange-50 border-orange-300 ring-1 ring-orange-500 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-1 w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                              checked={isChecked}
                              onChange={() => toggleMember(m.id)}
                            />
                            <div className="ml-3 flex-1 min-w-0">
                              <div className="text-sm font-bold text-slate-900 truncate">{m.fullName}</div>
                              <div className="text-xs text-slate-500 mt-0.5 truncate" title={m.email}>
                                {m.email}
                              </div>
                              <div className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wider">
                                {m.role.replaceAll('_', ' ')}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div className="space-y-6 max-w-2xl">
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 text-sm">
                      <div>
                        <dt className="font-semibold text-slate-500 mb-1">Project Name</dt>
                        <dd className="font-bold text-slate-900">{form.name || '—'}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500 mb-1">Methodology</dt>
                        <dd className="font-bold text-slate-900">
                          {form.methodology === 'AGILE' ? 'Agile' : 'Waterfall'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500 mb-1">Timeline</dt>
                        <dd className="font-bold text-slate-900">
                          {form.startDate || '—'} <span className="text-slate-400 mx-1">→</span> {form.endDate || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-500 mb-1">Team Size</dt>
                        <dd className="font-bold text-slate-900">{form.teamMemberIds.length} member(s)</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-semibold text-slate-500 mb-2">Description</dt>
                        <dd className="text-slate-700 whitespace-pre-wrap">{form.description || '—'}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-semibold text-slate-500 mb-2">Tech Stack</dt>
                        <dd className="font-medium text-slate-900">
                          {form.techStack.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {form.techStack.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-md text-xs font-semibold">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            '—'
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-between items-center">
              <button
                type="button"
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={back}
                disabled={step === 0}
              >
                Back
              </button>
              
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                  onClick={next}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting && (
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {submitting ? 'Creating project...' : 'Create Project'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}