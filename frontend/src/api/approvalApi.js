import { api } from './client.js'

export const approvalApi = {
  getApprovals: (projectId) => api.get(`/projects/${projectId}/approvals`),
  createApproval: (projectId, data) => api.post(`/projects/${projectId}/approvals`, data),
  actionApproval: (projectId, approvalId, data) => api.put(`/projects/${projectId}/approvals/${approvalId}/action`, data),
  getMyApprovals: () => api.get('/approvals/my'),
  deleteApproval: (projectId, approvalId) => api.delete(`/projects/${projectId}/approvals/${approvalId}`),
}
