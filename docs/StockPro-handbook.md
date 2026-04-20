# 📘 StockPro Engineering Handbook

This handbook defines **core standards and conventions** for all microservices in the StockPro system.
It ensures consistency, scalability, and maintainability across the entire platform.

---

# 🧠 1. Core Principles

* Every microservice must follow the same structure and patterns
* No business logic in controllers
* All configurations must be externalized (environment variables)
* APIs must follow a consistent response format
* Code must be modular, readable, and testable

---

# 🏗 2. Microservice Architecture

* Each service is independent and self-contained
* Services communicate via APIs (no shared database)
* Auth-service is responsible for authentication and token generation
* Other services validate tokens (temporary) → later handled by API Gateway

---

# 📁 3. Folder Structure Standard

Each microservice must follow a consistent layered structure:

* **config** → security, filters, configuration classes
* **controller** → HTTP layer (no business logic)
* **service** → business logic
* **repository** → database access
* **entity** → database models
* **dto/request** → incoming API payloads
* **dto/response** → outgoing API payloads
* **mapper** → entity ↔ DTO conversion
* **exception** → global error handling
* **common** → shared utilities and response wrappers
* **validation** → validation groups and rules

---

# 🔐 4. Authentication Standard (JWT)

* JWT is generated only in **auth-service**

* All requests must include token in header:

  `Authorization: Bearer <token>`

* Each service:

  * validates token
  * extracts user identity and role
  * sets security context

* Services must NOT:

  * perform login logic
  * access user database for authentication

* Future:

  * JWT validation will be moved to API Gateway
  * services will trust forwarded headers

---

# 📦 5. API Response Standard

All APIs must return a consistent structure:

## Success Response

* `success` → boolean
* `message` → human-readable message
* `data` → response payload (or null)
* `timestamp` → ISO-8601

## Error Response

* `success` → false
* `message` → high-level message
* `error` → detailed error
* `status` → HTTP status code
* `path` → API endpoint
* `timestamp` → ISO-8601

---

# ⚠️ 6. Error Handling

* Use a global exception handler in every service
* Do not expose stack traces to clients
* Use meaningful error messages
* Map exceptions to proper HTTP status codes
* Keep error format consistent across services

---

# 🔄 7. DTO & Mapper Standard

* DTOs define API contract (not entities)
* Separate:

  * request DTOs
  * response DTOs
* Never expose entity directly in API
* Use mapper layer for conversion
* Mapper contains no business logic

---

# 🔧 8. Environment Configuration

* All services must use `.env` files
* No hardcoded credentials in code

## Variable Strategy

* Common variables → shared across environments
* Development → prefixed with `LOCAL_`
* Production → default variables

## Resolution Pattern

* Prefer production variable
* fallback to development variable

---

# 🐳 9. Docker Standard

* Each service must have a Dockerfile
* Use docker-compose at root level
* Services must:

  * read environment variables via `.env`
  * connect using container names (not localhost)

---

# 📦 10. Common Library (common-lib but later after all the services are built)

All shared code must live in a separate module: common-lib

Services must depend on it as a library, not a folder reference

Contains:

* API response structures
* Error response models
* Shared utilities (e.g., JWT helpers, constants)

Rules:

* No business logic
* Must be reusable across services
* Must not tightly couple services

---

# 🧾 11. Logging Standard

* Logging must be present in every service

* Use structured logging approach

* Log:

  * API entry points
  * important business actions
  * errors and warnings

* Avoid:

  * excessive logs
  * logging sensitive data

---

# 🧠 12. Git & Commit Standard

## Format

`type(scope): description`

## Types

* feat → new feature
* fix → bug fix
* refactor → code improvement
* test → testing
* chore → maintenance
* docs → documentation
* style → formatting

## Rules

* One commit = one logical change
* Use clear, concise messages
* Avoid vague commits (e.g., "update", "done")

---

# 🌿 13. Branching Strategy

* `main` → production-ready code
* `dev` → integration branch
* `feature/*` → feature development

## Flow

* Create branch from `dev`
* Implement feature
* Create PR → merge into `dev`

---


# ⚠️ 15. Anti-Patterns (Avoid)

* Mixing business logic in controller
* Returning entity directly
* Hardcoding secrets
* Different response formats across services
* Copy-paste architecture inconsistently
* Over-engineering early

---

# 🧩 Final Principle

> Consistency across services is more important than perfection in one service.

---

# 🚀 Summary

This handbook ensures:

* uniform architecture
* predictable APIs
* easier scaling
* cleaner collaboration

Every microservice must strictly follow these standards.
