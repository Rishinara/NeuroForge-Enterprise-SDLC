import { api } from './client.js'

export const aiApi = {
  estimateStoryPoints: (title, description) =>
    api.post('/ai/story-points', { title, description }),
  recommendPriority: (title, description) =>
    api.post('/ai/priority', { title, description }),
  generateTaskBreakdown: (title, description) =>
    api.post('/ai/breakdown', { title, description }),
  generateAcceptanceCriteria: (title, description) =>
    api.post('/ai/acceptance-criteria', { title, description }),
  enhanceTaskDescription: (title, description) =>
    api.post('/ai/enhance-description', { title, description }),
  analyzeSprint: (sprintName, tasks) =>
    api.post('/ai/sprint-planning', { sprintName, tasks }),
  analyzeProjectRisk: (projectName, tasks) =>
    api.post('/ai/risk-analysis', { projectName, tasks }),
}
