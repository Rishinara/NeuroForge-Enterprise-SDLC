import api from '../lib/api';

export interface ProjectMemberResponse {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description?: string;
  methodology: string;
  status: string;
  health: string;
  startDate: string;
  endDate: string;
  techStack: string[];
  team: ProjectMemberResponse[];
  teamSize: number;
  progressPercent: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  methodology: string;
  startDate?: string;
  endDate?: string;
  orgId: number;
  teamMemberIds?: number[];
  techStack?: string[];
}

export const projectService = {
  create: (data: CreateProjectRequest) =>
    api.post<ProjectResponse>('/projects', data),

  getAll: () =>
    api.get<ProjectResponse[]>('/projects'),

  getByOrgId: (orgId: number) =>
    api.get<ProjectResponse[]>(`/orgs/${orgId}/projects`),

  getById: (id: number) =>
    api.get<ProjectResponse>(`/projects/${id}`),

  update: (id: number, data: Partial<CreateProjectRequest>) =>
    api.put<ProjectResponse>(`/projects/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/projects/${id}`),

  getMilestones: (id: number) =>
    api.get<any[]>(`/projects/${id}/milestones`),
};
