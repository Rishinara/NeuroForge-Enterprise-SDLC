import api from '../lib/api';

export interface StoryPointResponse {
  storyPoints: number | null;
  reason: string;
}

export interface SprintPlanningResponse {
  analysis: string;
}

export interface RiskAnalysisResponse {
  analysis: string;
}

export interface TaskEnhancementResponse {
  enhancedDescription: string;
}

export interface MapResponse {
  [key: string]: string;
}

export const aiService = {
  test: () =>
    api.post<any>('/ai/test'),

  estimateStoryPoints: (data: { title: string; description: string }) =>
    api.post<StoryPointResponse>('/ai/story-points', data),

  suggestPriority: (data: { title: string; description: string }) =>
    api.post<MapResponse>('/ai/priority', data),

  breakdownTask: (data: { title: string; description: string }) =>
    api.post<MapResponse>('/ai/breakdown', data),

  generateAcceptanceCriteria: (data: { title: string; description: string }) =>
    api.post<MapResponse>('/ai/acceptance-criteria', data),

  enhanceDescription: (data: { title: string; description: string }) =>
    api.post<TaskEnhancementResponse>('/ai/enhance-description', data),

  sprintPlanning: (data: { sprintName: string; tasks: string[] }) =>
    api.post<SprintPlanningResponse>('/ai/sprint-planning', data),

  riskAnalysis: (data: { projectName: string; tasks: string[] }) =>
    api.post<RiskAnalysisResponse>('/ai/risk-analysis', data),
};
