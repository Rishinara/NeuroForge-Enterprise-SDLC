# NeuroForge Enterprise SDLC Platform

## Module Completed

### Authentication & User Management

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

## APIs

### Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |

## User Management (SUPER_ADMIN)

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/admin/create-user` | Create a new user |
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/users/{id}` | Get user by ID |
| PUT | `/api/admin/users/{id}/role` | Update user role |
| PATCH | `/api/admin/users/{id}/status` | Enable or disable a user |
| DELETE | `/api/admin/users/{id}` | Permanently delete a user |

---

# Security Features

- JWT Token Authentication
- Stateless Authentication
- Password Encryption using BCrypt
- Role-Based Authorization
- Protected REST APIs
- Bean Validation
- Global Exception Handling

---

## Tech Stack

- Java 21
- Spring Boot
- Spring Security
- JWT
- Spring Data JPA
- PostgreSQL
- Maven