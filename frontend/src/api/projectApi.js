import { api } from './client.js'

export const projectApi = {
  createProject: (payload) => api.post('/projects', payload),
  getProject: (id) => api.get(`/projects/${id}`),
  listProjects: () => api.get('/projects'),
  updateProject: (id, payload) => api.put(`/projects/${id}`, payload),
  deleteProject: (id) => api.delete(`/projects/${id}`),
}