import { api } from './client.js'

export const projectApi = {
  createProject: (orgId, payload) => api.post('/projects', { ...payload, orgId }),
  getProject: (id) => api.get(`/projects/${id}`),
  listProjects: (orgId) => api.get(orgId ? `/orgs/${orgId}/projects` : '/projects'),
  listOrgProjects: (orgId) => api.get(`/orgs/${orgId}/projects`),
  updateProject: (id, payload) => api.put(`/projects/${id}`, payload),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  listMilestones: (projectId) => api.get(`/projects/${projectId}/milestones`),
  toggleMilestone: (projectId, milestoneId, completed) =>
    api.patch(`/projects/${projectId}/milestones/${milestoneId}?completed=${completed}`),
  getHealthSnapshots: (projectId) => api.get(`/projects/${projectId}/snapshots`),
}