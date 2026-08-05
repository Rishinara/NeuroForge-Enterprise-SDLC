import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('neuroforge_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const cleanObject = (obj) => {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(cleanObject)
    
    const cleaned = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key]
        if (val === 'null' || val === 'undefined' || val === null || val === undefined) {
          // strip the property completely
        } else if (typeof val === 'object') {
          cleaned[key] = cleanObject(val)
        } else {
          cleaned[key] = val
        }
      }
    }
    return cleaned
  }

  if (config.params) {
    config.params = cleanObject(config.params)
  }

  if (config.data && !(config.data instanceof FormData)) {
    config.data = cleanObject(config.data)
  }

  // Clean URL if it accidentally contains 'null' or 'undefined' in paths or manual query strings
  if (config.url) {
    // Strip manual query string parts like ?param=null or &param=null
    config.url = config.url.replace(/([?&])[^=]+=(?:null|undefined)(?:&|$)/g, '$1')
      .replace(/[?&]$/, '') // remove trailing ? or &
    
    // Do NOT strip from path (e.g. /api/orgs/null -> /api/orgs/)
    // This breaks Spring MVC path routing. Let the backend InitBinder handle "null" path variables gracefully.
  }

  return config
})


api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const token = localStorage.getItem('neuroforge_token')
      if (token) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh`,
            { token }
          )
          localStorage.setItem('neuroforge_token', data.token)
          originalRequest.headers.Authorization = `Bearer ${data.token}`
          return api(originalRequest)
        } catch {
          localStorage.removeItem('neuroforge_token')
          window.location.href = '/login'
        }
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