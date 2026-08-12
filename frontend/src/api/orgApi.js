import { api } from './client.js'

export const orgApi = {
  // Organizations
  createOrganization: (payload) => api.post('/organizations', payload),
  listOrganizations: () => api.get('/organizations'),
  deleteOrganization: (id) => api.delete(`/organizations/${id}`),
  assignOrgAdmin: (orgId, userId) => api.post(`/organizations/${orgId}/assign-admin`, { userId }),
  removeOrgAdmin: (orgId, userId) => api.delete(`/organizations/${orgId}/admin/${userId}`),

  // Teams
  listTeams: (orgId) => api.get(`/orgs/${orgId}/teams`),
  listTeamsWithMembers: (orgId) => api.get(`/orgs/${orgId}/teams-with-members`),
  getTeam: (orgId, teamId) => api.get(`/orgs/${orgId}/teams/${teamId}`),
  createTeam: (orgId, payload) => api.post(`/orgs/${orgId}/teams`, payload),
  updateTeam: (orgId, teamId, payload) => api.put(`/orgs/${orgId}/teams/${teamId}`, payload),
  deleteTeam: (orgId, teamId) => api.delete(`/orgs/${orgId}/teams/${teamId}`),
  removeTeamMember: (orgId, teamId, memberId) => api.delete(`/orgs/${orgId}/teams/${teamId}/members/${memberId}`),

  // Members
  listMembers: (orgId) => api.get(`/orgs/${orgId}/members`),
  updateMemberRole: (orgId, memberId, role) =>
    api.put(`/orgs/${orgId}/members/${memberId}/role`, { role }),
  removeMember: (orgId, memberId) => api.delete(`/orgs/${orgId}/members/${memberId}`),

  // Invites
  listInvites: (orgId) => api.get(`/orgs/${orgId}/invites`),
  inviteMember: (orgId, payload) => api.post(`/orgs/${orgId}/invites`, payload),
  cancelInvite: (orgId, inviteId) => api.delete(`/orgs/${orgId}/invites/${inviteId}`),
  getInvitePreview: (token) => api.get(`/invites/${token}`),
  acceptInvite: (token) => api.post(`/invites/${token}/accept`),

  // Activities
  listActivities: (orgId) => api.get(`/orgs/${orgId}/activities`),

  // Join Requests
  getJoinRequests: (orgId) => api.get(`/orgs/${orgId}/join-requests`),
  approveJoinRequest: (orgId, userId) => api.post(`/orgs/${orgId}/join-requests/${userId}/approve`),
  rejectJoinRequest: (orgId, userId) => api.post(`/orgs/${orgId}/join-requests/${userId}/reject`),

  // Pending Approvals
  getPendingUsers: (orgId) => api.get(`/orgs/${orgId}/pending-users`),
  approveUser: (orgId, userId) => api.post(`/orgs/${orgId}/users/${userId}/approve`),

  // Org settings
  getOrgSettings: (orgId) => api.get(`/orgs/${orgId}/settings`),
  updateOrgSettings: (orgId, payload) => api.put(`/orgs/${orgId}/settings`, payload),
}