import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardLayout from './components/DashboardLayout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import AcceptInvitePage from './pages/AcceptInvitePage.jsx'
import UnauthorizedPage from './pages/UnauthorizedPage.jsx'
import DashboardHome from './pages/DashboardHome.jsx'
import TeamsPage from './pages/TeamsPage.jsx'
import OrgSettingsPage from './pages/OrgSettingsPage.jsx'
import ProjectsPortfolioPage from './pages/ProjectsPortfolioPage.jsx'
import CreateProjectPage from './pages/CreateProjectPage.jsx'
import ProjectDetailPage from './pages/ProjectDetailPage.jsx'
import SpecsListPage from './pages/SpecsListPage.jsx'
import SpecEditorPage from './pages/SpecEditorPage.jsx'
import BacklogPage from './pages/BacklogPage.jsx'
import KanbanBoardPage from './pages/KanbanBoardPage.jsx'
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/invite/:token" element={<AcceptInvitePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/org/teams" element={<TeamsPage />} />
            <Route path="/org/settings" element={<OrgSettingsPage />} />
            <Route path="/projects" element={<ProjectsPortfolioPage />} />
            <Route path="/projects/new" element={<CreateProjectPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/projects/:projectId/specs" element={<SpecsListPage />} />
<Route path="/projects/:projectId/specs/new" element={<SpecEditorPage />} />
<Route path="/projects/:projectId/specs/:specId" element={<SpecEditorPage />} />
<Route path="/projects/:projectId/backlog" element={<BacklogPage />} />
<Route path="/projects/:projectId/board" element={<KanbanBoardPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}