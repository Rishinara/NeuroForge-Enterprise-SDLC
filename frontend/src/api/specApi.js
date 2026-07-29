import { api } from './client.js'

export const specApi = {
  listSpecs: (projectId) => api.get(`/projects/${projectId}/specs`),
  getSpec: (specId) => api.get(`/specs/${specId}`),
  createSpec: (projectId, payload) => api.post(`/projects/${projectId}/specs`, payload),
  updateSpec: (specId, payload) => api.put(`/specs/${specId}`, payload),
  listVersions: (specId) => api.get(`/specs/${specId}/versions`),
  getVersion: (specId, version) => api.get(`/specs/${specId}/versions/${version}`),
  submitForReview: (specId) => api.post(`/specs/${specId}/submit`),
  approveSpec: (specId) => api.post(`/specs/${specId}/approve`),
  requestChanges: (specId, note) => api.post(`/specs/${specId}/request-changes`, { note }),
}