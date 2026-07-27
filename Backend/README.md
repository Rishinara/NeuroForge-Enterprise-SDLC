# NeuroForge Enterprise SDLC Platform

A comprehensive Enterprise Software Development Life Cycle (SDLC) platform inspired by Jira and Azure DevOps. The platform streamlines project management, team collaboration, Agile planning, and software delivery through secure role-based access and real-time collaboration.

---

# Modules Completed

## Module 1 – Authentication & User Management

### Features
- User Registration
- User Login
- JWT Authentication
- Spring Security
- Role-Based Access Control (RBAC)
- BCrypt Password Encryption
- Global Exception Handling
- Request Validation

### Supported Roles
- SUPER_ADMIN
- ORG_ADMIN
- PROJECT_MANAGER
- DEVELOPER
- QA_TESTER
- CLIENT

---

## Module 2 – Organization & Team Management

### Features
- Organization Creation
- Team Creation
- Invite Members via Email
- Accept Organization Invitations
- Team Member Management
- List Organization Members
- List Teams
- Organization-Level Access Control

---

## Module 3 – Project & Portfolio Management

### Features
- Create Project
- Update Project
- Delete Project
- Get Project Details
- Portfolio Dashboard
- Assign Team Members
- Technology Stack Management
- Project Health Tracking
- Project Status Management

### Supported Methodologies
- Agile
- Waterfall

---

## Module 5 – Agile Planning (Boards, Sprints & Backlog)

### Sprint Management
- Create Sprint
- Update Sprint
- Delete Sprint
- Get Sprint Details
- List Project Sprints
- Start Sprint
- Complete Sprint

### Task Management
- Create Task
- Update Task
- Delete Task
- Assign Task to Sprint
- Remove Task from Sprint
- Backlog Management

### Kanban Board
- TODO
- IN_PROGRESS
- CODE_REVIEW
- TESTING
- DONE

### Task Workflow
- Task Status Updates
- Status Transition Validation
- Task Status History
- Story Points
- Task Labels
- Requirement Traceability

### Sprint Analytics
- Story Point Snapshots
- Burndown Chart API
- Sprint Summary
- Completion Percentage

### Real-Time Collaboration
- Spring WebSocket
- STOMP Messaging
- Live Kanban Board Synchronization

---

# REST APIs

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |

---

## User Management

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/admin/create-user` | Create a new user |
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/users/{id}` | Get user by ID |
| PUT | `/api/admin/users/{id}/role` | Update user role |
| PATCH | `/api/admin/users/{id}/status` | Enable or Disable User |
| DELETE | `/api/admin/users/{id}` | Delete User |

---

## Organization & Team Management

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/organizations` | Create Organization |
| POST | `/api/organizations/{id}/invite` | Invite Member |
| POST | `/api/invites/{token}/accept` | Accept Invitation |
| GET | `/api/organizations/{id}/members` | List Members |
| POST | `/api/teams` | Create Team |
| GET | `/api/teams` | List Teams |

---

## Project Management

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/projects` | Create Project |
| GET | `/api/projects/{id}` | Get Project |
| GET | `/api/projects` | List Projects |
| PUT | `/api/projects/{id}` | Update Project |
| DELETE | `/api/projects/{id}` | Delete Project |

---

## Sprint Management

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/sprints` | Create Sprint |
| GET | `/api/sprints/{id}` | Get Sprint |
| PUT | `/api/sprints/{id}` | Update Sprint |
| DELETE | `/api/sprints/{id}` | Delete Sprint |
| POST | `/api/sprints/{id}/start` | Start Sprint |
| POST | `/api/sprints/{id}/complete` | Complete Sprint |
| GET | `/api/projects/{projectId}/sprints` | List Project Sprints |

---

## Task Management

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/tasks` | Create Task |
| GET | `/api/tasks/{id}` | Get Task |
| PUT | `/api/tasks/{id}` | Update Task |
| DELETE | `/api/tasks/{id}` | Delete Task |
| PATCH | `/api/tasks/{id}/status` | Update Task Status |
| PATCH | `/api/tasks/{id}/assign-sprint` | Assign Sprint |
| PATCH | `/api/tasks/{id}/remove-sprint` | Remove Sprint |

---

## Agile Board

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/sprints/{id}/board` | Get Kanban Board |

---

## Sprint Analytics

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/sprints/{id}/snapshot` | Capture Story Point Snapshot |
| GET | `/api/sprints/{id}/burndown` | Get Burndown Data |

---

# Security Features

- JWT Authentication
- Stateless Authentication
- Spring Security
- BCrypt Password Encryption
- Role-Based Authorization
- Protected REST APIs
- Bean Validation
- Global Exception Handling

---

# Real-Time Communication

### WebSocket Endpoint

```
/ws
```

### Topic

```
/topic/sprints/{sprintId}
```

Live updates are broadcast whenever a task status changes, ensuring all users viewing the same sprint receive real-time Kanban board updates.

---

# Database Tables

- users
- organizations
- teams
- invites
- projects
- project_members
- sprints
- tasks
- task_status_history
- story_point_snapshots

---

# Tech Stack

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- JWT Authentication
- PostgreSQL
- Spring WebSocket (STOMP)
- Maven

---

# NeuroForge – Module 6: AI Integration

## Overview

This module integrates Artificial Intelligence into the NeuroForge application using the **Groq API**. The AI features assist Agile teams by providing intelligent recommendations for project planning and task management.

---

## Technology Stack

- Java 17
- Spring Boot 3.5.x
- Groq API
- REST API
- Swagger / OpenAPI
- Maven

---

## AI Features Implemented

### 1. AI Test
**Endpoint**
```
POST /api/ai/test
```
Tests the Groq AI integration by sending a custom prompt.

---

### 2. Story Point Estimation
**Endpoint**
```
POST /api/ai/story-points
```
Estimates Agile Story Points based on the task title and description.

---

### 3. Priority Recommendation
**Endpoint**
```
POST /api/ai/priority
```
Recommends the task priority (LOW, MEDIUM, HIGH, or CRITICAL).

---

### 4. Task Breakdown
**Endpoint**
```
POST /api/ai/breakdown
```
Generates smaller actionable subtasks from a larger task.

---

### 5. Acceptance Criteria Generation
**Endpoint**
```
POST /api/ai/acceptance-criteria
```
Automatically generates acceptance criteria for a task.

---

### 6. Task Description Enhancement
**Endpoint**
```
POST /api/ai/enhance-description
```
Improves task descriptions by suggesting:
- Enhanced description
- Requirements
- Acceptance criteria

---

### 7. Sprint Planning Assistant
**Endpoint**
```
POST /api/ai/sprint-planning
```
Analyzes sprint tasks and provides:
- Sprint summary
- Workload analysis
- Potential risks
- Recommendations
- Sprint health

---

### 8. Project Risk Analysis
**Endpoint**
```
POST /api/ai/risk-analysis
```
Analyzes project risks and identifies:
- High-risk tasks
- Possible delays
- Dependency issues
- Testing risks
- Risk mitigation suggestions

---

## API Documentation

Swagger UI:

```
http://localhost:8082/swagger-ui/index.html
```

---

## AI Provider

**Provider:** Groq

**Model Used:**
```
llama-3.1-8b-instant
```

---

## Project Structure

```
src/main/java/com/neuroforge
│
├── ai
│   ├── GroqService.java
│   ├── GroqRequest.java
│   ├── GroqResponse.java
│   └── GroqMessage.java
│
├── controller
│   └── AiController.java
│
└── dto
    └── ai
        ├── StoryPointRequest.java
        ├── StoryPointResponse.java
        ├── SprintPlanningRequest.java
        ├── SprintPlanningResponse.java
        ├── RiskAnalysisRequest.java
        ├── RiskAnalysisResponse.java
        └── TaskEnhancementResponse.java
```

---

## Sample Request

### Story Point Estimation

**POST**
```
/api/ai/story-points
```

**Request Body**

```json
{
  "title": "Implement Login API",
  "description": "Develop JWT authentication with login validation."
}
```

**Sample Response**

```json
{
  "storyPoints": null,
  "reason": "Story Points: 5\nReason: JWT authentication requires backend validation, token generation, and testing."
}
```

---

## Testing

The module was tested using:

- Postman
- Swagger UI

---

## Notes

- AI functionality is implemented as a separate service (`GroqService`) to keep it independent from the core business logic.
- API errors are handled gracefully to avoid application crashes.
- Swagger documentation is available for all AI endpoints.

---

## Author

**Rishitha Mendem**

**Module:** AI Integration (Module 6)

**Project:** NeuroForge Enterprise SDLC



