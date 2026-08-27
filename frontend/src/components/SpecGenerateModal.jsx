import { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import { useSpecs } from '../hooks/useSpecs.js';
import { useNavigate } from 'react-router-dom';

export default function SpecGenerateModal({ open, onClose, projectId, project }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('TECHNICAL');
  const [complexity, setComplexity] = useState('MODERATE');
  const { generateSpec, loading, error: apiError } = useSpecs();
  const navigate = useNavigate();

  // Removed pre-filled description as requested
  useEffect(() => {
    if (open && !description) {
      // Intentionally left empty to allow placeholder to show
    }
  }, [open]);

  // Don't close if generating
  const handleClose = () => {
    if (loading) return;
    setTitle('');
    setDescription('');
    setTone('TECHNICAL');
    setComplexity('MODERATE');
    onClose(false); // pass false meaning no reload needed
  };

  const isFormValid = title.trim().length > 0 && description.trim().length >= 10;

  const handleGenerate = async () => {
    if (!isFormValid) return;

    const res = await generateSpec({ 
      title, 
      description,
      tone,
      complexity,
      project_id: projectId 
    });

    if (res.data) {
      handleClose();
      navigate(`/projects/${projectId}/specs/${res.data.id}`);
    }
  };

  return (
    <Modal
      open={open}
      title="Generate AI Specification"
      onClose={handleClose}
      maxWidth="max-w-xl"
      footer={
        <div className="flex flex-col items-end gap-2 w-full">
          <div className="flex justify-end gap-3 w-full">
            <button 
              type="button"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all active:scale-[0.98]" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="button"
              className={`px-5 py-2 rounded-xl text-sm font-semibold flex items-center justify-center min-w-[140px] transition-all shadow-xs active:scale-[0.98] ${
                isFormValid && !loading 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
              onClick={handleGenerate}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 text-white animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating…</span>
                </>
              ) : (
                '✨ Generate Spec'
              )}
            </button>
          </div>
          {loading && (
            <p className="text-[11px] text-slate-400 font-medium pr-1">Synthesizing requirements with AI (takes 5-10 seconds)…</p>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {apiError && !loading && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-xs text-red-700">
              <span className="font-bold block mb-0.5">Generation Failed</span>
              {apiError}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Feature Title <span className="text-orange-500">*</span>
          </label>
          <input 
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs placeholder:text-slate-400" 
            placeholder="e.g., OAuth 2.0 User Authentication Flow" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Requirement Prompt / Description <span className="text-orange-500">*</span>
          </label>
          <textarea 
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs min-h-[140px] resize-y placeholder:text-slate-400"
            placeholder="Describe the feature naturally — e.g. Users must be able to sign up with Google and GitHub, reset passwords via email, and enforce multi-factor authentication for admins..." 
            rows={5}
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={loading}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Describe the feature naturally — the AI will synthesize user stories, edge cases, and acceptance criteria.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Tone</label>
            <select 
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs cursor-pointer"
              value={tone}
              onChange={e => setTone(e.target.value)}
              disabled={loading}
            >
              <option value="TECHNICAL">Technical (Standard)</option>
              <option value="CASUAL">Casual & Accessible</option>
              <option value="FORMAL">Formal / Enterprise</option>
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Complexity</label>
            <select 
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none transition-all shadow-2xs cursor-pointer"
              value={complexity}
              onChange={e => setComplexity(e.target.value)}
              disabled={loading}
            >
              <option value="SIMPLE">Simple (Basic ACs)</option>
              <option value="MODERATE">Moderate (Standard)</option>
              <option value="DETAILED">Detailed (Edge Cases)</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
