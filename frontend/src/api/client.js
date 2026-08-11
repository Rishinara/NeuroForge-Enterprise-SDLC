import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('neuroforge_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  
  const orgId = localStorage.getItem('neuroforge_org_id')
  if (orgId) config.headers['X-Org-Id'] = orgId

  const method = (config.method || 'get').toLowerCase()
  if (method === 'get') {
    config.params = {
      ...config.params,
      _t: new Date().getTime()
    }
  }
  
  return config
})


api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('neuroforge_token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)


export function extractErrorMessage(err) {
  const data = err?.response?.data
  if (data) {
    if (typeof data === 'string') return data
    if (data.message) return data.message
    if (data.error) return data.error
    if (typeof data === 'object') {
      const values = Object.values(data).filter((v) => typeof v === 'string')
      if (values.length > 0) return values.join('. ')
    }
  }
  return err?.message || 'Something went wrong. Please try again.'
}