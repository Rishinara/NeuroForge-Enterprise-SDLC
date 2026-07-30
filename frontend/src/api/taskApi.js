import { api } from './client.js'

const STATUS_MAP = {
  'To Do': 'TODO',
  'In Progress': 'IN_PROGRESS',
  'Code Review': 'CODE_REVIEW',
  'Testing': 'TESTING',
  'Done': 'DONE',
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  CODE_REVIEW: 'CODE_REVIEW',
  TESTING: 'TESTING',
  DONE: 'DONE',
}

export const taskApi = {
  createTask: (payload) => api.post('/tasks', payload), 
  getTask: (id) => api.get(`/tasks/${id}`),
  updateTask: (id, payload) => api.put(`/tasks/${id}`, payload),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status: STATUS_MAP[status] || status }),
  assignSprint: (id, sprintId) => api.post(`/tasks/${id}/assign-sprint/${sprintId}`),
  removeSprint: (id) => api.post(`/tasks/${id}/remove-sprint`),
}