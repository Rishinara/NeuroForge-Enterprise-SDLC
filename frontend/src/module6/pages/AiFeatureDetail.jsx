import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import AppLayout from '../layouts/AppLayout.jsx';
import AiFeatureForm from '../components/organisms/AiFeatureForm.jsx';
import AiResultPanel from '../components/organisms/AiResultPanel.jsx';
import EmptyState from '../components/molecules/EmptyState.jsx';
import { getAiFeatureById } from '../data/aiFeatures.js';

function AiFeatureDetail() {
  const { featureId } = useParams();
  const navigate = useNavigate();
  const feature = getAiFeatureById(featureId);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(payload) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await feature.call(payload);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!feature) {
    return (
      <AppLayout title="AI Assistant">
        <div className="card">
          <EmptyState title="Feature not found" description="This AI feature doesn't exist." />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={feature.title}>
      <div className="mx-auto max-w-5xl">
        <button onClick={() => navigate('/ai-assistant')} className="btn-ghost mb-4 px-2">
          <FiArrowLeft size={16} /> Back to AI Assistant
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{feature.title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AiFeatureForm feature={feature} onSubmit={handleSubmit} submitting={loading} />
          <AiResultPanel feature={feature} result={result} loading={loading} error={error} />
        </div>
      </div>
    </AppLayout>
  );
}

export default AiFeatureDetail;
