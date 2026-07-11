import { api } from './client.js'

export const orgApi = {
  // Teams
  listTeams: (orgId) => api.get(`/orgs/${orgId}/teams`),
  createTeam: (orgId, payload) => api.post(`/orgs/${orgId}/teams`, payload),
  deleteTeam: (orgId, teamId) => api.delete(`/orgs/${orgId}/teams/${teamId}`),

  // Members
  listMembers: (orgId) => api.get(`/orgs/${orgId}/members`),
  updateMemberRole: (orgId, memberId, role) =>
    api.put(`/orgs/${orgId}/members/${memberId}/role`, { role }),
  removeMember: (orgId, memberId) => api.delete(`/orgs/${orgId}/members/${memberId}`),

  // Invites
  inviteMember: (orgId, payload) => api.post(`/orgs/${orgId}/invites`, payload),
  getInvitePreview: (token) => api.get(`/invites/${token}`),
  acceptInvite: (token) => api.post(`/invites/${token}/accept`),

  // Org settings
  getOrgSettings: (orgId) => api.get(`/orgs/${orgId}/settings`),
  updateOrgSettings: (orgId, payload) => api.put(`/orgs/${orgId}/settings`, payload),
}