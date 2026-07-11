import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { ROLES } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import AcceptInvitePage from './pages/AcceptInvitePage.jsx'
import TeamsPage from './pages/TeamsPage.jsx'
import OrgSettingsPage from './pages/OrgSettingsPage.jsx'
import UnauthorizedPage from './pages/UnauthorizedPage.jsx'
// import DashboardRouter from './pages/DashboardRouter.jsx'

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
            path="/dashboard"
            element={
              <ProtectedRoute>
                {/* <DashboardRouter /> */}
                <div>Dashboard placeholder</div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/org/teams"
            element={
              <ProtectedRoute roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
                <TeamsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/org/settings"
            element={
              <ProtectedRoute roles={[ROLES.ORG_ADMIN, ROLES.SUPER_ADMIN]}>
                <OrgSettingsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}