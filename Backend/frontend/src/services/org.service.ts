import api from '../lib/api';

export interface CreateOrgRequest {
  name: string;
  description?: string;
  supportEmail: string;
}

export interface InviteRequest {
  email: string;
  role: string;
  teamId: number;
}

export interface InvitePreviewResponse {
  valid: boolean;
  role: string;
  orgName: string;
  invitedEmail: string;
  reasonIfInvalid?: string;
}

export interface TeamResponse {
  id: number;
  name: string;
  memberCount: number;
}

export interface MemberResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  enabled: boolean;
  joinedAt: string;
  teams: string[];
}

export interface Organization {
  id: number;
  name: string;
  description?: string;
  supportEmail: string;
}

export interface Invite {
  id: number;
  email: string;
  role: string;
  token: string;
  status: string;
}

export interface OrgSettings {
  id: number;
  organizationId: number;
  theme: string;
}

export const orgService = {
  create: (data: CreateOrgRequest) =>
    api.post<Organization>('/organizations', data),

  getAll: () =>
    api.get<Organization[]>('/organizations'),

  createTeam: (orgId: number, data: { name: string }) =>
    api.post<TeamResponse>(`/orgs/${orgId}/teams`, data),

  getTeams: (orgId: number) =>
    api.get<TeamResponse[]>(`/orgs/${orgId}/teams`),

  deleteTeam: (orgId: number, teamId: number) =>
    api.delete<void>(`/orgs/${orgId}/teams/${teamId}`),

  getMembers: (orgId: number) =>
    api.get<MemberResponse[]>(`/orgs/${orgId}/members`),

  updateMemberRole: (orgId: number, memberId: number, data: { role: string }) =>
    api.put<MemberResponse>(`/orgs/${orgId}/members/${memberId}/role`, data),

  removeMember: (orgId: number, memberId: number) =>
    api.delete<void>(`/orgs/${orgId}/members/${memberId}`),

  inviteMember: (orgId: number, data: InviteRequest) =>
    api.post<Invite>(`/orgs/${orgId}/invites`, data),

  getInvite: (token: string) =>
    api.get<InvitePreviewResponse>(`/invites/${token}`),

  acceptInvite: (token: string) =>
    api.post<void>(`/invites/${token}/accept`),

  getSettings: (orgId: number) =>
    api.get<OrgSettings>(`/orgs/${orgId}/settings`),

  updateSettings: (orgId: number, data: Partial<OrgSettings>) =>
    api.put<OrgSettings>(`/orgs/${orgId}/settings`, data),
};
