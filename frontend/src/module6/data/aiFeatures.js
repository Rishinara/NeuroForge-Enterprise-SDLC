import { FiActivity, FiCalendar, FiCheckSquare, FiEdit3, FiFlag, FiList, FiShield } from 'react-icons/fi';
import * as aiService from '../services/aiService.js';

// `fields` describes exactly what the backend's request DTOs expect:
// StoryPointRequest { title, description }
// SprintPlanningRequest { sprintName, tasks: string[] }
// RiskAnalysisRequest { projectName, tasks: string[] }
//
// `responseKey` is the single text field on the response DTO holding the AI's
// raw answer. None of these endpoints return structured data — they return
// one block of LLM-generated text — so the UI renders that field as-is
// instead of pretending to parse it into separate badges/lists.
export const AI_FEATURES = [
  {
    id: 'story-points',
    title: 'Story Point Estimation',
    description: 'Estimate story points for a task based on its complexity.',
    icon: FiActivity,
    call: aiService.estimateStoryPoints,
    responseKey: 'reason',
    note: 'The backend always returns storyPoints as null — the actual estimate is embedded in this text.',
    fields: [
      { name: 'title', label: 'Task Title', placeholder: 'Implement Login API' },
      {
        name: 'description',
        label: 'Task Description',
        type: 'textarea',
        placeholder: 'Develop JWT authentication with login validation and role-based access control.',
      },
    ],
  },
  {
    id: 'priority',
    title: 'Priority Recommendation',
    description: 'Get an AI-suggested priority for your task.',
    icon: FiFlag,
    call: aiService.recommendPriority,
    responseKey: 'response',
    fields: [
      { name: 'title', label: 'Task Title', placeholder: 'Fix login timeout bug' },
      { name: 'description', label: 'Task Description', type: 'textarea', placeholder: 'Describe the task in detail…' },
    ],
  },
  {
    id: 'breakdown',
    title: 'Task Breakdown',
    description: 'Break a large task into smaller, actionable subtasks.',
    icon: FiList,
    call: aiService.generateTaskBreakdown,
    responseKey: 'response',
    fields: [
      { name: 'title', label: 'Task Title', placeholder: 'Build customer onboarding flow' },
      { name: 'description', label: 'Task Description', type: 'textarea', placeholder: 'Describe the task in detail…' },
    ],
  },
  {
    id: 'acceptance-criteria',
    title: 'Acceptance Criteria',
    description: 'Generate acceptance criteria for a user story.',
    icon: FiCheckSquare,
    call: aiService.generateAcceptanceCriteria,
    responseKey: 'response',
    fields: [
      { name: 'title', label: 'Story Title', placeholder: 'As a user, I can reset my password' },
      { name: 'description', label: 'Story Description', type: 'textarea', placeholder: 'Describe the user story…' },
    ],
  },
  {
    id: 'enhance-description',
    title: 'Enhance Description',
    description: 'Improve a rough task description into a clear, professional one.',
    icon: FiEdit3,
    call: aiService.enhanceTaskDescription,
    responseKey: 'enhancedDescription',
    fields: [
      { name: 'title', label: 'Task Title', placeholder: 'Implement search filters' },
      { name: 'description', label: 'Draft Description', type: 'textarea', placeholder: 'Paste your rough draft here…' },
    ],
  },
  {
    id: 'sprint-planning',
    title: 'Sprint Planning',
    description: "Analyze a sprint's workload and get AI recommendations.",
    icon: FiCalendar,
    call: aiService.analyzeSprint,
    responseKey: 'analysis',
    fields: [
      { name: 'sprintName', label: 'Sprint Name', placeholder: 'Sprint 1' },
      {
        name: 'tasks',
        label: 'Tasks (one per line)',
        type: 'lines',
        placeholder: 'Login API\nUser Registration\nPassword reset flow',
      },
    ],
  },
  {
    id: 'risk-analysis',
    title: 'Risk Analysis',
    description: "Identify potential risks across your project's tasks.",
    icon: FiShield,
    call: aiService.analyzeProjectRisk,
    responseKey: 'analysis',
    fields: [
      { name: 'projectName', label: 'Project Name', placeholder: 'NeuroForge' },
      {
        name: 'tasks',
        label: 'Tasks (one per line)',
        type: 'lines',
        placeholder: 'Integrate AI API\nBuild auth module\nWrite integration tests',
      },
    ],
  },
];

export function getAiFeatureById(id) {
  return AI_FEATURES.find((f) => f.id === id) || null;
}
