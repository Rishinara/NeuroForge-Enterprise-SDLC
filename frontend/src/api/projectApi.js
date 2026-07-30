import { api } from './client.js'

export const projectApi = {
  createProject: (orgId, payload) => api.post(`/orgs/${orgId}/projects`, payload),
 

  listOrgProjects: (orgId) => api.get(`/orgs/${orgId}/projects`),
  getProject: (projectId) => api.get(`/projects/${projectId}`),

  
  toggleMilestone: (projectId, milestoneId, completed) =>
    api.patch(`/projects/${projectId}/milestones/${milestoneId}?completed=${completed}`),

  getHealthSnapshots: (projectId) => api.get(`/projects/${projectId}/snapshots`),
}