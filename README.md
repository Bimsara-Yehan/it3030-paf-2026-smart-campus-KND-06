# Smart Campus Operations Hub

A full-stack web application for managing campus resources, room bookings, IT support tickets, and notifications — built as a collaborative team project.

---

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Backend      | Java 17, Spring Boot 3, Spring Security |
| Database     | PostgreSQL 15, Flyway migrations        |
| ORM          | Spring Data JPA / Hibernate             |
| Auth         | JWT (stateless)                         |
| Frontend     | React 18, TypeScript, Vite              |
| Styling      | Tailwind CSS                            |
| API Client   | Axios                                   |
| Testing      | JUnit 5, Mockito, React Testing Library |
| CI/CD        | GitHub Actions                          |
| Container    | Docker, Docker Compose                  |

---

## Team & Module Ownership

| Member   | Module                          | Branch prefix              |
|----------|---------------------------------|----------------------------|
| Member A | Module A — Resource Management  | `feature/module-A-*`       |
| Member B | Module B — Room Bookings        | `feature/module-B-*`       |
| Member C | Module C — IT Support Tickets   | `feature/module-C-*`       |
| Member D | Module D — Auth & User Mgmt     | `feature/module-DE-*`      |
| Member E | Module E — Notifications        | `feature/module-DE-*`      |

---

## Prerequisites

- Java 17 (Temurin recommended)
- Maven 3.9+
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 (or use Docker)

---

## Backend Setup

```bash
cd backend

# Copy and edit env vars
cp .env.example .env

# Run database migrations and start server
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Docker Setup

```bash
cd docker
docker compose up -d
```

This starts PostgreSQL and the backend service. The frontend can still be run locally with `npm run dev`.

---

## Running Tests

```bash
# Backend — all tests
cd backend && ./mvnw test

# Backend — single test class
./mvnw test -Dtest=ResourceServiceTest

# Frontend — all tests
cd frontend && npm test

# Frontend — watch mode
npm run test:watch
```

---

## AI Disclosure

Parts of this project were developed with assistance from AI coding tools (Claude Code / GitHub Copilot). All AI-generated code was reviewed, tested, and validated by the team members responsible for each module. Final authorship and accountability rest with the respective team members listed above.
