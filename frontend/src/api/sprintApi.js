import { api } from './client.js'

export const sprintApi = {
  createSprint: (payload) => api.post('/sprints', payload), 
  updateSprint: (sprintId, payload) => api.put(`/sprints/${sprintId}`, payload), 
  deleteSprint: (sprintId) => api.delete(`/sprints/${sprintId}`),
  getSprint: (sprintId) => api.get(`/sprints/${sprintId}`),
  listProjectSprints: (projectId) => api.get(`/sprints/project/${projectId}`),

  startSprint: (sprintId) => api.post(`/sprints/${sprintId}/start`),
  completeSprint: (sprintId) => api.post(`/sprints/${sprintId}/complete`), 
  captureSnapshot: (sprintId) => api.post(`/sprints/${sprintId}/snapshot`), 
  getBurndown: (sprintId) => api.get(`/sprints/${sprintId}/burndown`),
}