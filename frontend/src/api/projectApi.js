import { api } from './client.js'

export const projectApi = {
  listProjects: (orgId) => api.get(`/orgs/${orgId}/projects`),
  getProject: (projectId) => api.get(`/projects/${projectId}`),
  createProject: (payload) => api.post('/projects', payload),
  updateProject: (projectId, payload) => api.put(`/projects/${projectId}`, payload),
  listMilestones: (projectId) => api.get(`/projects/${projectId}/milestones`),
}