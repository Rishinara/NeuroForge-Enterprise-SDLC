import { api } from './client.js'

export const projectApi = {
  createProject: (payload) => api.post('/projects', payload),
  getProject: (id) => api.get(`/projects/${id}`),
  listProjects: (orgId) => api.get(orgId ? `/orgs/${orgId}/projects` : '/projects'),
  updateProject: (id, payload) => api.put(`/projects/${id}`, payload),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  listMilestones: (projectId) => api.get(`/projects/${projectId}/milestones`),
}