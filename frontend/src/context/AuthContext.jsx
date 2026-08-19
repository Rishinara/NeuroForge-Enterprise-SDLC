import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)


export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  DEVELOPER: 'DEVELOPER',
  FRONTEND_DEVELOPER: 'FRONTEND_DEVELOPER',
  BACKEND_DEVELOPER: 'BACKEND_DEVELOPER',
  QA_TESTER: 'QA_TESTER',
  CLIENT: 'CLIENT',
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem('neuroforge_token'))
  const [user, setUser] = useState(null) // 
  const [loading, setLoading] = useState(true)

  const setToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('neuroforge_token', newToken)
    } else {
      localStorage.removeItem('neuroforge_token')
    }
    setTokenState(newToken)
  }, [])

  const refreshMe = useCallback(async () => {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      setUser({
        userId: 'mock-user-1',
        email: 'you@example.com',
        fullName: 'Test User',
        orgId: 'mock-org-1',
        orgName: 'Test Org',
        role: ROLES.ORG_ADMIN, 
      })
      setToken('mock-token')
      setLoading(false)
      return
    }

    if (!localStorage.getItem('neuroforge_token')) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const res = await api.get('/auth/me')
      const userData = res.data?.user || res.data
      setUser(userData)
      if (userData?.orgId) {
        localStorage.setItem('neuroforge_org_id', userData.orgId)
      } else {
        localStorage.removeItem('neuroforge_org_id')
      }
    } catch {
      setUser(null)
      setToken(null)
      localStorage.removeItem('neuroforge_org_id')
    } finally {
      setLoading(false)
    }
  }, [setToken])

  useEffect(() => {
    refreshMe()
  }, [token])

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password })
      
      setToken(res.data.token)
      setUser(res.data.user)
      return res.data.user
    },
    [setToken]
  )

  const signup = useCallback(
    async ({ fullName, email, phone, role, password, orgId }) => {
      const res = await api.post('/auth/signup', { fullName, email, phone, role, password, orgId })
      setToken(res.data.token)
      setUser(res.data.user)
      return res.data.user
    },
    [setToken]
  )
const forgotPassword = useCallback(async (email) => {
    await api.post('/auth/forgot-password', { email })
  }, [])

  const resetPassword = useCallback(async (email, otp, newPassword) => {
    await api.post('/auth/reset-password', { email, otp, newPassword })
  }, [])
  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('neuroforge_org_id')
    window.location.href = '/login'
  }, [setToken])

  const value = {
    token,
    setToken,
    user,
    setUser,
    loading,
    refreshMe,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    role: user?.role || null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}