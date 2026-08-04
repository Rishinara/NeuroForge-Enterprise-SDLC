import { api } from './client.js'

export const adminApi = {
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (payload) => api.post('/admin/create-user', payload),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id, enabled) => api.patch(`/admin/users/${id}/status`, { enabled: Boolean(enabled) }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
}
