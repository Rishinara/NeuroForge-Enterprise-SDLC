
import { useAuth } from '../context/AuthContext.jsx'

export default function Can({ roles, children, fallback = null }) {
  const { role } = useAuth()
  if (!roles || roles.length === 0) return children
  return roles.includes(role) ? children : fallback
}