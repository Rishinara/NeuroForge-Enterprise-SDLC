import AppLayout from '../layouts/AppLayout.jsx';
import AiFeatureCard from '../components/organisms/AiFeatureCard.jsx';
import { AI_FEATURES } from '../data/aiFeatures.js';

function AiAssistant() {
  return (
    <AppLayout title="AI Assistant">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">AI Assistant</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Get AI-powered insights for your project management.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AI_FEATURES.map((feature) => (
            <AiFeatureCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default AiAssistant;
