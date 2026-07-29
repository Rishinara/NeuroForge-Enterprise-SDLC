import { api } from './client.js'

export const taskApi = {
  createTask: (payload) => api.post('/tasks', payload), 
  getTask: (id) => api.get(`/tasks/${id}`),
  updateTask: (id, payload) => api.put(`/tasks/${id}`, payload),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  assignSprint: (id, sprintId) => api.patch(`/tasks/${id}/assign-sprint`, { sprintId }),
  removeSprint: (id) => api.patch(`/tasks/${id}/remove-sprint`),

}