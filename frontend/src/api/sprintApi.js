import { api } from './client.js'

export const sprintApi = {
 
  createSprint: (payload) => api.post('/sprints', payload), // payload must include projectId
  getSprint: (id) => api.get(`/sprints/${id}`),
  updateSprint: (id, payload) => api.put(`/sprints/${id}`, payload),
  deleteSprint: (id) => api.delete(`/sprints/${id}`),
  startSprint: (id) => api.post(`/sprints/${id}/start`),
  completeSprint: (id) => api.post(`/sprints/${id}/complete`),
  listProjectSprints: (projectId) => api.get(`/projects/${projectId}/sprints`),

  
  getBoard: (sprintId) => api.get(`/sprints/${sprintId}/board`),

 
  captureSnapshot: (sprintId) => api.post(`/sprints/${sprintId}/snapshot`),
  getBurndown: (sprintId) => api.get(`/sprints/${sprintId}/burndown`),
}