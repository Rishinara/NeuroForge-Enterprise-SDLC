
import { api } from './client.js'

export const orgAdminApi = {
  
  listTeams: (orgId) => api.get(`/orgs/${orgId}/teams`),
  createTeam: (orgId, payload) => api.post(`/orgs/${orgId}/teams`, payload), // { name }
  deleteTeam: (orgId, teamId) => api.delete(`/orgs/${orgId}/teams/${teamId}`),

  listMembers: (orgId) => api.get(`/orgs/${orgId}/members`),
  updateMemberRole: (orgId, memberId, role) =>
    api.put(`/orgs/${orgId}/members/${memberId}/role`, { role }),
  removeMember: (orgId, memberId) => api.delete(`/orgs/${orgId}/members/${memberId}`),

  
  inviteMember: (orgId, { email, role, teamId }) =>
    api.post(`/orgs/${orgId}/invites`, { email, role, teamId }),
  getInvitePreview: (token) => api.get(`/invites/${token}`),
  acceptInvite: (token) => api.post(`/invites/${token}/accept`), 

  getOrgSettings: (orgId) => api.get(`/orgs/${orgId}/settings`),
  updateOrgSettings: (orgId, payload) => api.put(`/orgs/${orgId}/settings`, payload), 
}