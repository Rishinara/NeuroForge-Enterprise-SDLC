import { api } from './client.js'

export const taskApi = {
  createTask: (payload) => api.post('/tasks', payload),
  

  updateTask: (taskId, payload) => api.put(`/tasks/${taskId}`, payload),

  deleteTask: (taskId) => api.delete(`/tasks/${taskId}`),
  getTask: (taskId) => api.get(`/tasks/${taskId}`),

  listProjectBacklog: (projectId) => api.get(`/tasks/project/${projectId}/backlog`),
  
  assignTaskToSprint: (taskId, sprintId) => api.post(`/tasks/${taskId}/assign-sprint/${sprintId}`),
  removeTaskFromSprint: (taskId) => api.post(`/tasks/${taskId}/remove-sprint`),

  updateStatus: (taskId, status) => api.patch(`/tasks/${taskId}/status`, { status }),
  

  getTaskHistory: (taskId) => api.get(`/tasks/${taskId}/history`),

  getBoard: (sprintId) => api.get(`/tasks/${sprintId}/board`),
}