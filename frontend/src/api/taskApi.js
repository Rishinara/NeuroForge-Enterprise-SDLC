import { api } from './client.js'

export const taskApi = {
  createTask: (payload) => api.post('/tasks', payload), 
  getTask: (id) => api.get(`/tasks/${id}`),
  updateTask: (id, payload) => api.put(`/tasks/${id}`, payload),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  assignSprint: (id, sprintId) => api.post(`/tasks/${id}/assign-sprint/${sprintId}`),
  removeSprint: (id) => api.post(`/tasks/${id}/remove-sprint`),
  listProjectBacklog: (projectId) => api.get(`/tasks/project/${projectId}/backlog`),
  assignTaskToSprint: (taskId, sprintId) => api.post(`/tasks/${taskId}/assign-sprint/${sprintId}`),
  removeTaskFromSprint: (taskId) => api.post(`/tasks/${taskId}/remove-sprint`),
  getTaskHistory: (taskId) => api.get(`/tasks/${taskId}/history`),
  getBoard: (sprintId) => api.get(`/tasks/${sprintId}/board`),
}