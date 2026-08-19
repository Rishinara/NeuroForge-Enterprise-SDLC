import { api } from './client.js'

export const deliverableApi = {
  getDeliverables: (projectId) => api.get(`/projects/${projectId}/deliverables`),
  updateDeliverable: (projectId, deliverableId, data) => api.put(`/projects/${projectId}/deliverables/${deliverableId}`, data),
  submitDeliverable: (projectId, deliverableId) => api.post(`/projects/${projectId}/deliverables/${deliverableId}/submit`),
  clientAction: (projectId, deliverableId, data) => api.post(`/projects/${projectId}/deliverables/${deliverableId}/client-action`, data),
}
