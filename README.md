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
