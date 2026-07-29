# NeuroForge Enterprise SDLC - Project Analysis Report

This document presents a comprehensive structural and functional analysis of both the **Frontend** (React + Vite) and **Backend** (Spring Boot + JPA) modules of the NeuroForge application (located in the `infosys` project directory).

---

## 1. Project Overview & Architecture

The NeuroForge platform is structured as an enterprise-grade Agile Project Management tool with AI-enhanced capabilities. 

### 🛠️ Technology Stack
* **Frontend:**
  * **Core Library:** React 19.2.7 (with Vite 8.1.1 as the build tool and development server)
  * **Routing:** React Router DOM 7.18.1
  * **HTTP Client:** Axios 1.18.1
  * **Styling:** Vanilla CSS (utilizing a workspace-wide utility design system in files like `agile.css`, `workspace.css`, and `specs.css`)
  * **Authentication:** Custom JWT-based context-driven session management (`AuthContext.jsx`)
* **Backend:**
  * **Framework:** Spring Boot 3.x (Java 17+)
  * **Build Tool:** Maven (defined in `pom.xml`)
  * **Data Access:** Spring Data JPA + Hibernate ORM
  * **Database:** PostgreSQL (configured for running locally on port 5432)
  * **Security:** Spring Security 6.x (JWT authentication, role-based method security using `@PreAuthorize`)
  * **API Documentation:** SpringDoc OpenAPIV3 (Swagger UI)
  * **Real-time Communication:** Spring WebSocket + STOMP Messaging Broker

---

### 📂 Directory & Module Structure

The project is split into two primary modules under the root directory:

```
Infosys Project/
├── Frontend/                           # React/Vite Frontend Application
│   ├── .env                            # Local environment variables
│   ├── vite.config.js                  # Vite configuration
│   ├── package.json                    # Project metadata & npm dependencies
│   ├── index.html                      # HTML Entry point
│   ├── public/                         # Static assets
│   └── src/                            # React Application Source
│       ├── main.jsx                    # Vite bootstrap file
│       ├── App.jsx                     # Route definitions & AuthProvider wrapper
│       ├── api/                        # API client configuration & services
│       │   ├── client.js               # Axios instance configuration & interceptors
│       │   ├── orgApi.js               # Organizations & Teams API calls
│       │   ├── projectApi.js           # Projects API calls
│       │   ├── specApi.js              # Specs API calls (SRS)
│       │   ├── sprintApi.js            # Sprints API calls
│       │   └── taskApi.js              # Tasks API calls
│       ├── components/                 # Shared & page-specific components
│       ├── context/                    # State management context
│       │   └── AuthContext.jsx         # User Authentication & Role mapping
│       ├── pages/                      # Application Page views
│       └── styles/                     # CSS stylesheets
│
├── backend/                            # Spring Boot Backend Application
│   ├── pom.xml                         # Maven dependencies definition
│   ├── docker-compose.yml              # PostgreSQL database container configuration
│   └── src/main/
│       ├── java/com/neuroforge/        # Java Application Source
│       │   ├── NeuroforgeBackendApplication.java # Spring Boot main class
│       │   ├── ai/                     # AI Service layer integration (Groq API client)
│       │   ├── config/                 # Security, WebSocket, and CORS configurations
│       │   ├── controller/             # REST Endpoints Controllers
│       │   ├── dto/                    # Data Transfer Objects
│       │   │   ├── auth/               # Authentication-related requests/responses
│       │   │   ├── organization/       # Organization & Team DTOs
│       │   │   ├── project/            # Project DTOs
│       │   │   ├── task/               # Task & Board DTOs
│       │   │   └── ...                 # Flattened legacy DTOs (Code Health duplicate issue)
│       │   ├── entity/                 # Database JPA entities
│       │   ├── enums/                  # System Enums (Roles, Statuses, Priorities)
│       │   ├── exception/              # Exception handling classes
│       │   ├── mapper/                 # Object Mappers (Entity to DTO conversion)
│       │   ├── repository/             # Spring Data JPA Repository Interfaces
│       │   ├── security/               # JWT validation filters & custom details service
│       │   ├── service/                # Core Service Interfaces
│       │   │   └── impl/               # Service Implementation classes
│       │   └── websocket/              # STOMP messages pub-sub publishers
│       └── resources/                  # Resource files
│           ├── application.properties  # Shared configuration properties
│           ├── application-dev.properties  # Development environment credentials & database configurations
│           └── application-prod.properties # Production environment configurations
```

---

## 2. Frontend & Backend Connectivity Mapping

Understanding how the frontend and backend interact is critical to prevent breaking existing integrations during future updates.

### 🔐 Authentication Mechanism
1. The frontend stores the user's JSON Web Token (JWT) in `localStorage` under the key **`neuroforge_token`**.
2. The Axios client defined in [client.js](file:///D:/Infosys%20Project/Frontend/src/api/client.js) sets up an request interceptor to automatically attach the header:
   ```http
   Authorization: Bearer <neuroforge_token>
   ```
3. If the backend responds with `401 Unauthorized`, the client interceptor automatically removes `neuroforge_token` and redirects the user to the `/login` route.

### 🌐 Environment Configurations
* The frontend reads its target API endpoint from its `.env` file via the key:
  `VITE_API_BASE_URL=http://localhost:8082/api`
* The backend runs on port `8082` (configured in [application.properties](file:///D:/Infosys%20Project/backend/src/main/resources/application.properties)).
* CORS is configured in [SecurityConfig.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/config/SecurityConfig.java) to allow cross-origin requests specifically from the frontend's local development server running on `http://localhost:5173`.

---

### ⚠️ CRITICAL CONTRACT MISMATCHES & INTEGRATION BREAKAGES

There are several severe mismatches between the frontend API service layer (and page views) and the backend REST endpoints. These mismatches currently break key integration points and result in page crashes or mock data fallbacks:

| Mismatch Area | Frontend Implementation (Page/API call) | Expected Backend Endpoint | Status / Impact |
| :--- | :--- | :--- | :--- |
| **Project Listing** | [ProjectsPortfolioPage.jsx](file:///D:/Infosys%20Project/Frontend/src/pages/ProjectsPortfolioPage.jsx#L31) and [DashboardHome.jsx](file:///D:/Infosys%20Project/Frontend/src/pages/DashboardHome.jsx#L35) call `projectApi.listProjects()`, mapping to `GET /api/projects`. | `@GetMapping("/orgs/{organizationId}/projects")` in [ProjectController.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/controller/ProjectController.java#L33) (requires `organizationId`). | **Broken (404)**. Falls back to rendering local static `SAMPLE_PROJECTS`. |
| **Project Deletion** | `projectApi.deleteProject(id)` maps to `DELETE /api/projects/{id}`. | No corresponding endpoint in the backend. | **Broken (404)**. Project deletion fails on the server. |
| **Project Milestones** | [ProjectDetailPage.jsx](file:///D:/Infosys%20Project/Frontend/src/pages/ProjectDetailPage.jsx#L43) calls `projectApi.listMilestones(projectId)`. | `@GetMapping("/projects/{projectId}/milestones")` in [ProjectController.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/controller/ProjectController.java#L64). | **Runtime Crash**. The function `listMilestones` is completely missing from [projectApi.js](file:///D:/Infosys%20Project/Frontend/src/api/projectApi.js). |
| **Sprint List** | `sprintApi.listProjectSprints(projectId)` maps to `GET /api/projects/{projectId}/sprints`. | `@GetMapping("/project/{projectId}")` in [SprintController.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/controller/SprintController.java#L70) (maps to `GET /api/sprints/project/{projectId}`). | **Broken (404)**. Unable to fetch sprints. |
| **Kanban Board** | [KanbanBoardPage.jsx](file:///D:/Infosys%20Project/Frontend/src/pages/KanbanBoardPage.jsx#L42) calls `sprintApi.getBoard(sprintId)`, mapping to `GET /api/sprints/{sprintId}/board`. | `@GetMapping("/{sprintId}/board")` in [TaskController.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/controller/TaskController.java#L129) (maps to `GET /api/tasks/{sprintId}/board`). | **Broken (404)**. Kanban board fails to load tasks. |
| **Active Sprint Board** | Default board loads with `sprintId = 'current'`, resulting in `GET /api/sprints/current/board`. | `@PathVariable Long sprintId` requires a numeric type in Java. No logic to handle a literal `'current'` string. | **Broken (500/400)**. Types mismatch exception thrown on backend parse attempt. |
| **Task Backlog** | [BacklogPage.jsx](file:///D:/Infosys%20Project/Frontend/src/pages/BacklogPage.jsx#L33) calls `GET /api/projects/{projectId}/tasks`. | `@GetMapping("/project/{projectId}/backlog")` in [TaskController.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/controller/TaskController.java#L70) (maps to `GET /api/tasks/project/{projectId}/backlog`). | **Broken (404)**. Backlog list stays empty; displays warning alert. |
| **Sprint Assignment** | `taskApi.assignSprint(id, sprintId)` calls `PATCH /api/tasks/{id}/assign-sprint` sending `sprintId` in the request body. | `@PostMapping("/{taskId}/assign-sprint/{sprintId}")` in [TaskController.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/controller/TaskController.java#L81). | **Broken (404/405)**. Task assignment to a sprint fails. |
| **Sprint Removal** | `taskApi.removeSprint(id)` calls `PATCH /api/tasks/{id}/remove-sprint`. | `@PostMapping("/{taskId}/remove-sprint")` in [TaskController.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/controller/TaskController.java#L94). | **Broken (404/405)**. Task removal from sprint fails. |

---

## 3. Existing & Required Feature Audit

### ✅ Fully Implemented & Operational Features
1. **User Authentication (V2 & V1 APIs):**
   * Staged and validated signup (`POST /api/auth/signup`), login (`POST /api/auth/login`), profile query (`GET /api/auth/me`), password reset request, and JWT token refresh mechanisms.
2. **Organizations Management:**
   * Creation of organizations, settings configurations, and membership updates.
3. **Teams Management:**
   * Ability to create, list, and delete teams inside an organization.
4. **Organization Members / Invites:**
   * Core workflow to list organization members, modify user roles, remove users, and generate/resolve system invites.
5. **Basic Sprints & Tasks:**
   * Database management (CRUD operations) for tasks and sprints, capturing story point snapshots, and generating burndown datasets.

---

### ❌ Incomplete, Missing, or Broken Features
1. **Spec (Software Requirements Specification) Module (COMPLETELY MISSING BACKEND):**
   * **Frontend Status:** The frontend implements [SpecEditorPage.jsx](file:///D:/Infosys%20Project/Frontend/src/pages/SpecEditorPage.jsx) and [SpecsListPage.jsx](file:///D:/Infosys%20Project/Frontend/src/pages/SpecsListPage.jsx) allowing users to construct user stories, map functional/non-functional requirements, submit specs for reviews, and manage versions.
   * **Backend Status:** The backend has **no database entities, no repositories, and no controller endpoints** supporting Specs. The backend is completely unaware of requirements tracing.
   * **Impact:** Users cannot save or view specs. Saving is mocked in the frontend via a local fallback warning: *"Saved locally (backend unreachable)"*, but the data is immediately lost on refresh.
2. **AI Module (MISSING FRONTEND IMPLEMENTATION):**
   * **Backend Status:** [AiController.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/controller/AiController.java) and [GroqService.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/ai/GroqService.java) are fully implemented. They query the Groq API using a Llama model to provide story point estimation, task breakdown generation, acceptance criteria extraction, description enhancements, sprint planning analysis, and risk recommendation.
   * **Frontend Status:** The frontend has **no pages, no dashboard components, and no API services** linked to `/api/ai/*`.
   * **Impact:** The AI engine is completely inaccessible to end-users.
3. **Real-time WebSockets (MISSING FRONTEND IMPLEMENTATION):**
   * **Backend Status:** Integrates standard STOMP WebSocket configurations ([WebSocketConfig.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/config/WebSocketConfig.java)) and triggers events when task statuses change (`TaskEventPublisher.java`).
   * **Frontend Status:** No WebSocket libraries or connections are initialized. The board requires manual reloads or explicit action triggers to update.
4. **Milestone Tracking (STUBBED IN BACKEND & BROKEN IN FRONTEND):**
   * **Backend Status:** Returns a dummy empty list (`List.of()`) in the backend controller.
   * **Frontend Status:** Lacks the endpoint mapping inside `projectApi.js` entirely, throwing runtime client-side execution crashes.

---

## 4. Updation & Optimization Points

### 🧹 Code Health & Quality
* **Duplicate DTOs:** Due to safe file migrations, legacy data contracts (e.g. [ApiResponse.java](file:///D:/Infosys%20Project/backend/src/main/java/com/neuroforge/dto/ApiResponse.java)) are duplicated. They exist both directly inside `com.neuroforge.dto` (legacy) and within subdirectory packages like `com.neuroforge.dto.auth` (modern). 
* **Action:** The legacy flat files under `com.neuroforge.dto` should be deleted, and controllers should import them cleanly from the subdirectories.

### 🔒 Security & Validation vulnerabilities
* **Hardcoded Credentials:** The file [application-dev.properties](file:///D:/Infosys%20Project/backend/src/main/resources/application-dev.properties) contains multiple severe credential exposures:
  * **Database Password:** `spring.datasource.password=Root` (Line 8)
  * **SMTP E-mail Settings:** `spring.mail.username=vmowneesh8@gmail.com` and `spring.mail.password=drorbsqkgnplwbue` (Lines 18-19, exposed Google App Password).
  * **Default JWT Secret Key:** `jwt.secret` (Line 13)
* **Action:** Move all credentials to system environment variables and load them via Spring Boot placeholders:
  ```properties
  spring.datasource.password=${DB_PASSWORD}
  spring.mail.password=${SMTP_PASSWORD}
  jwt.secret=${JWT_SECRET_KEY}
  ```

---

### ⚙️ Configuration Issues
* **Database Name Mismatch:** 
  * Docker-compose initiates PostgreSQL with database name **`neuroforge_db`**.
  * The development property configuration [application-dev.properties](file:///D:/Infosys%20Project/backend/src/main/resources/application-dev.properties#L6) attempts to connect to database **`neurofourge_db`** (spelled with a 'u').
  * **Impact:** The application fails to start up locally unless the developer manually overrides the database name.
* **Missing AI Configuration Key:**
  * `GroqService` requires a value for `${groq.api.key}`. This key is **not declared** anywhere in `application.properties` or `application-dev.properties`.
  * **Impact:** Application fails to launch unless `groq.api.key` is manually set as an environment variable.

---

### ⚡ Performance & Scalability
* **Missing Indexing:** Database tables for sprint status histories and story point snapshots lack indexing on lookup columns (`sprint_id`, `task_id`), which will degrade performance when generating burndown metrics over time.
* **Lack of Caching:** Project metrics and dashboard metadata (e.g., project health distribution) are calculated in real-time from raw queries without caching layers (such as Redis or Spring Cache).

---

## 5. Recommended Action Plan

To establish 100% connectivity and release all features in a stable, backward-compatible manner, follow this implementation sequence:

1. **Fix Configurations & Dev Environment:**
   * Correct database name to `neuroforge_db` in `application-dev.properties` to match `docker-compose.yml`.
   * Add a fallback value for `groq.api.key` to prevent Spring Boot startup failure.
2. **Align API Service Client and Controller Paths:**
   * Update the frontend client mapping files under `src/api` to use the correct paths that the backend expects, or define backward-compatible alias routes on the backend.
3. **Build Backend Spec (SRS) Module:**
   * Build JPA database entities (`Spec`, `UserStory`), Repository interfaces, Service layers, and controller mappings matching `specApi.js` endpoints.
4. **Implement AI and WebSocket UI Components:**
   * Expose the backend AI services via frontend dashboard options and backlog/story point estimating components.
   * Add STOMP WebSocket configurations on the frontend board page to enable real-time collaborative updates.
5. **Clean Legacy Code & Secure Credentials:**
   * Remove legacy flat DTO classes from `com.neuroforge.dto` once modern controllers have been fully migrated to use DTOs in subdirectory packages.
   * Bind exposed App Passwords, database passwords, and JWT secret keys to system environment variables.
