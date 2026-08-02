import { api } from './client.js'

export const profileApi = {
  getProfile: () => api.get('/profile'),
  updateProfile: (payload) => api.put('/profile', payload),
  changePassword: (payload) => api.post('/profile/change-password', payload),
}
