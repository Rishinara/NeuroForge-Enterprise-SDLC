import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoadingSpinner from './components/atoms/LoadingSpinner.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const CreateTicket = lazy(() => import('./pages/CreateTicket.jsx'));
const AISuggestion = lazy(() => import('./pages/AISuggestion.jsx'));
const EditSuggestion = lazy(() => import('./pages/EditSuggestion.jsx'));
const TicketDetails = lazy(() => import('./pages/TicketDetails.jsx'));
const AiAssistant = lazy(() => import('./pages/AiAssistant.jsx'));
const AiFeatureDetail = lazy(() => import('./pages/AiFeatureDetail.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-light dark:bg-surface-dark">
      <LoadingSpinner label="Loading page…" size={24} />
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets/new" element={<CreateTicket />} />
        <Route path="/tickets/:id" element={<TicketDetails />} />
        <Route path="/tickets/:id/suggestions" element={<AISuggestion />} />
        <Route path="/tickets/:id/edit" element={<EditSuggestion />} />
        <Route path="/ai-assistant" element={<AiAssistant />} />
        <Route path="/ai-assistant/:featureId" element={<AiFeatureDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
