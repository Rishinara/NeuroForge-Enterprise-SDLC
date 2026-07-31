import api from '../lib/api';

export interface UserStoryDTO {
  id: string;
  asA: string;
  iWant: string;
  soThat: string;
  criteria: string[];
}

export interface SpecVersionDTO {
  version: number;
  status: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface SpecResponse {
  id: number;
  title: string;
  description: string;
  status: string;
  version: number;
  userStories: UserStoryDTO[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  versions: SpecVersionDTO[];
}

export interface SpecSummaryResponse {
  id: number;
  title: string;
  storyCount: number;
  updatedAt: string;
  version: number;
  status: string;
}

export interface SpecRequest {
  title: string;
  description: string;
  userStories?: UserStoryDTO[];
  functionalRequirements?: string[];
  nonFunctionalRequirements?: string[];
}

export const specService = {
  getByProject: (projectId: number) =>
    api.get<SpecSummaryResponse[]>(`/projects/${projectId}/specs`),

  create: (projectId: number, data: SpecRequest) =>
    api.post<SpecResponse>(`/projects/${projectId}/specs`, data),

  getById: (specId: number) =>
    api.get<SpecResponse>(`/specs/${specId}`),

  update: (specId: number, data: SpecRequest) =>
    api.put<SpecResponse>(`/specs/${specId}`, data),

  getVersions: (specId: number) =>
    api.get<SpecVersionDTO[]>(`/specs/${specId}/versions`),

  getVersion: (specId: number, version: number) =>
    api.get<SpecVersionDTO>(`/specs/${specId}/versions/${version}`),

  submit: (specId: number) =>
    api.post<SpecResponse>(`/specs/${specId}/submit`),

  approve: (specId: number) =>
    api.post<SpecResponse>(`/specs/${specId}/approve`),

  requestChanges: (specId: number, data: { note: string }) =>
    api.post<SpecResponse>(`/specs/${specId}/request-changes`, data),
};
