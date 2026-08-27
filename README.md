# NeuroForge – Enterprise SDLC & Agile Management Platform

NeuroForge is an enterprise-grade Software Development Life Cycle (SDLC) and Agile management platform inspired by Jira, Azure DevOps, and Linear. It unites project planning, backlog grooming, real-time Kanban boards, client deliverables, role-based workflows, and AI-powered automation into a single cohesive system.

---

## 🌟 Key Features & Modules

### 1. 🔐 Authentication & Role-Based Access Control (RBAC)
- **Roles Supported:** `SUPER_ADMIN`, `ORG_ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `QA_TESTER`, `CLIENT`
- **Security:** Stateless JWT authentication (Access & Refresh tokens), BCrypt password hashing, Spring Security 6.
- **Admin Management:** User status control (Enable/Disable), dynamic role elevation, audit logging.

### 2. 🏢 Organization & Multi-Team Workspace
- **Multi-Tenancy:** Organization workspaces with custom branding and domain scoping.
- **Team Collaboration:** Create teams, assign project managers, invite members via email tokens.
- **Membership Management:** Organization-level and project-level role assignment.

### 3. 📁 Project & Portfolio Management
- **Project Governance:** Supports both **Agile** and **Waterfall** methodologies.
- **Portfolio Health:** Automated project health index, tech stack management, milestone tracking.
- **Deliverables & Client Portal:** Dedicated client portal for reviewing deliverables, requesting revisions, and approving milestones.

### 4. 📋 Agile Planning & Real-Time Boards
- **Interactive Kanban Board:** Drag-and-drop workflow (`TODO`, `IN_PROGRESS`, `CODE_REVIEW`, `TESTING`, `DONE`).
- **Live Collaboration:** Spring WebSocket with STOMP messaging for instant board synchronization across distributed teams.
- **Sprint Management:** Start/complete sprints, sprint backlog grooming, velocity tracking, and automated burndown charts.

### 5. 🤖 AI-Powered SDLC Assistant (Groq Cloud AI)
- **AI Specification Generator:** Automatically turns raw requirements into structured User Stories, Functional & Non-Functional requirements.
- **Story Point Estimation:** Suggests Fibonacci-scale story points with reasoning.
- **Priority Recommendation:** Recommends task priority based on technical impact and risk.
- **Task Breakdown & Acceptance Criteria:** Automatically decomposes complex tasks into subtasks and testable acceptance criteria.
- **Sprint & Risk Analytics:** AI analysis of sprint workloads and project bottleneck forecasting.

### 6. 🐛 Quality Assurance & Test Tracking
- **Bug Lifecycle:** Report, assign, prioritize, triage, and resolve defects with full audit trail.
- **Test Management:** Test case creation, execution runs, pass/fail reporting, and requirement traceability.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Axios, React Router 7 |
| **Backend** | Java 17+, Spring Boot 3.5.x, Spring Security, Spring Data JPA, Spring WebSocket (STOMP) |
| **Database** | PostgreSQL 15+ (HikariCP connection pool) |
| **AI Engine** | Groq Cloud API (Llama 3.1 / OSS Models) |
| **API Docs** | SpringDoc OpenAPI 3.0 / Swagger UI |
| **Build Tools** | Maven, npm |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java Development Kit (JDK):** 17 or higher
- **Node.js:** v18 or higher (with npm)
- **PostgreSQL:** Running on port 5432 (database: `neurofourge_db`)
- **Groq API Key:** (Optional, for AI features) Get from [Groq Console](https://console.groq.com/keys)

---

### 1. Database Setup
Create the PostgreSQL database:
```sql
CREATE DATABASE neurofourge_db;
```

---

### 2. Backend Configuration & Startup

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Configure environment variables (or copy `.env.example` to `.env`):
   ```bash
   # Linux / macOS
   export GROQ_API_KEY="your_groq_api_key"
   export JWT_SECRET="your_secure_256_bit_secret_key"

   # Windows (PowerShell)
   $env:GROQ_API_KEY="your_groq_api_key"
   $env:JWT_SECRET="your_secure_256_bit_secret_key"
   ```
3. Build and run the Spring Boot application:
   ```bash
   mvn clean spring-boot:run
   ```
   *Backend runs on:* `http://localhost:8082`  
   *Swagger API Docs:* `http://localhost:8082/swagger-ui.html`

---

### 3. Frontend Configuration & Startup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Frontend runs on:* `http://localhost:5173`

---

## 🔒 Environment Variables

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Backend Server Port | `8082` |
| `SPRING_DATASOURCE_URL` | PostgreSQL Connection URL | `jdbc:postgresql://localhost:5432/neurofourge_db` |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL User | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL Password | `Root` |
| `JWT_SECRET` | Secret key for HS256 JWT tokens | *(auto-configured for dev)* |
| `GROQ_API_KEY` | Groq Cloud AI API key | `gsk_...` |
| `VITE_API_BASE_URL` | Frontend API Gateway URL | `http://localhost:8082/api` |

---

## 👥 System Roles & Default Permissions

| Role | Permissions Overview |
|---|---|
| `SUPER_ADMIN` | Global platform administration, user management, organization oversight |
| `ORG_ADMIN` | Organization settings, team creation, inviting members, project allocation |
| `PROJECT_MANAGER` | Project setup, sprint planning, task assignment, backlog prioritization |
| `DEVELOPER` | Task execution, status updates, code review logging, bug resolution |
| `QA_TESTER` | Bug reporting, test case management, test execution runs |
| `CLIENT` | View project deliverables, submit feedback, approve/reject milestone deliverables |

---

## 📄 License
This project is proprietary and confidential. All rights reserved.
