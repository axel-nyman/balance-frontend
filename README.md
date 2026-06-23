# Balance Frontend

Personal budgeting web application for couples managing shared monthly finances.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development without Docker)

### Running with Docker

Start all services (database, backend, frontend):
```bash
docker compose up
```

Stop all services:
```bash
docker compose down
```

Stop and remove volumes:
```bash
docker compose down -v
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Database Admin (Adminer)**: http://localhost:8081
  - System: PostgreSQL
  - Server: db
  - Username: user
  - Password: password
  - Database: mydatabase

### Local Development (without Docker)

Install dependencies:
```bash
npm install
```

Start dev server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Tech Stack

- React 18 + TypeScript
- Vite
- TanStack Query
- React Router v6
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod

See [CLAUDE.md](./CLAUDE.md) for detailed project documentation.

## Docker preview images

Production images are built and tagged (versioned + `latest`) only when the
maintainer merges the release-please PR — that merge is the deploy gate.

Separately, every open pull request (once its lint/type-check/test/build checks
pass) publishes a multi-arch image under a single rolling tag, **`pr-latest`**
(e.g. `axelnyman/balance-frontend:pr-latest`), via the `docker-pr-preview.yml`
workflow. This lets the maintainer pull and run the current candidate build in
the **test environment** before deciding to merge. It is **not for
production**: the workflow never pushes the versioned or `latest` tags (those
stay exclusively release-please's). Each PR push overwrites `pr-latest`, so the
preview never accumulates per-PR/per-SHA tags on Docker Hub. Docs-only PRs
(`**.md`, `.claude/**`, `product/**`) skip the build.
