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



