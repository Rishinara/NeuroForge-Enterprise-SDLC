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

  useEffect(() => {
    if (open && project && project.description && !description) {
      setDescription(`Context: ${project.description}\n\nFeature: `);
    }
  }, [open, project, description]);

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
      footer={
        <div className="flex flex-col items-end gap-2 w-full">
          <div className="flex justify-end gap-3 w-full">
            <button 
              className="wk-btn wk-btn-secondary" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className={`wk-btn flex items-center justify-center min-w-[140px] transition-all ${
                isFormValid && !loading 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              onClick={handleGenerate}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 text-orange-500 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-orange-700">Generating...</span>
                </>
              ) : (
                'Generate Spec'
              )}
            </button>
          </div>
          {loading && (
            <p className="text-xs text-slate-500 pr-1">This usually takes 5-10 seconds</p>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-5 py-2">
        {apiError && !loading && (
          <div className="p-3 bg-red-50/80 border border-red-200 rounded-lg flex gap-3 items-start">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-red-700">
              <span className="font-semibold block mb-0.5">Generation Failed</span>
              {apiError}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-800">Title</label>
          <input 
            className="wk-input placeholder:text-slate-400" 
            placeholder="E.g., User Authentication Flow" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-800">Description</label>
          <textarea 
            className="wk-textarea min-h-[160px] resize-y placeholder:text-slate-400"
            placeholder="What feature are you building? Explain it naturally..." 
            rows={6}
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">
            Describe the feature naturally — the AI will structure it into user stories and requirements.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-semibold text-slate-800">Tone</label>
            <select 
              className="wk-input bg-white text-slate-800"
              value={tone}
              onChange={e => setTone(e.target.value)}
              disabled={loading}
            >
              <option value="TECHNICAL">Technical (Standard)</option>
              <option value="CASUAL">Casual & Accessible</option>
              <option value="FORMAL">Formal / Enterprise</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-sm font-semibold text-slate-800">Complexity</label>
            <select 
              className="wk-input bg-white text-slate-800"
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
