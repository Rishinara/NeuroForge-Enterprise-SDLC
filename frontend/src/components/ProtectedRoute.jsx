

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

import UnassignedOrgNotice from './UnassignedOrgNotice.jsx'

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#64748b' }}>
        Loading NeuroForge…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const isSuperAdmin = role === 'SUPER_ADMIN' || user?.role === 'SUPER_ADMIN'
  if (!isSuperAdmin && (!user?.orgId || user?.orgApproved === false)) {
    return <UnassignedOrgNotice />
  }

  if (roles && roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}