---
date: 2026-01-09T12:00:00+01:00
researcher: Claude
git_commit: 75492484bcb666e491d6c037728c3f63c8dc5be0
branch: main
repository: balance-frontend
topic: "Docker Configuration, Image Building, and Docker Hub Publishing"
tags: [research, docker, ci-cd, github-actions, nginx, deployment]
status: complete
last_updated: 2026-01-09
last_updated_by: Claude
---

# Research: Docker Configuration, Image Building, and Docker Hub Publishing

**Date**: 2026-01-09T12:00:00+01:00
**Researcher**: Claude
**Git Commit**: 75492484bcb666e491d6c037728c3f63c8dc5be0
**Branch**: main
**Repository**: balance-frontend

## Research Question

Research everything regarding Docker in this codebase, with extra focus on image building and Docker Hub publishing.

## Summary

This codebase has a complete Docker infrastructure with:
- **Two Dockerfiles**: Production (`Dockerfile`) and development (`Dockerfile.dev`)
- **Docker Compose**: Development stack with frontend, backend, database, and adminer
- **CI/CD Pipeline**: GitHub Actions with release-please for automated versioning and Docker Hub publishing
- **Docker Hub**: Images published to `axelnyman/balance-frontend` with semver tags

The production image uses a multi-stage build (Node.js for building, nginx for serving) with runtime-configurable backend URL via environment variable substitution.

## Detailed Findings

### Docker Files Inventory

| File | Purpose |
|------|---------|
| `Dockerfile` | Production multi-stage build |
| `Dockerfile.dev` | Development with Vite hot reload |
| `docker-compose.yml` | Development stack (4 services) |
| `.dockerignore` | Build context exclusions |
| `docker-entrypoint.sh` | Runtime config injection |
| `nginx.conf.template` | nginx configuration with env placeholders |
| `DEPLOYMENT.md` | Deployment documentation |

---

### Production Dockerfile (`Dockerfile`)

**Architecture**: Multi-stage build

**Stage 1 - Builder**:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

**Stage 2 - Production**:
```dockerfile
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
```

**Key characteristics**:
- Uses `npm ci` for reproducible builds
- Final image based on `nginx:alpine` (~82MB total)
- Static files served from `/usr/share/nginx/html`
- Custom entrypoint for runtime configuration

---

### Development Dockerfile (`Dockerfile.dev`)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

**Key characteristics**:
- Single-stage, development-focused
- Runs Vite dev server with hot module replacement
- Port 5173 exposed for development access
- Uses `--host` flag to allow external connections

---

### Docker Compose Configuration (`docker-compose.yml`)

Defines 4 services for local development:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `db` | `postgres:15` | 5432 | PostgreSQL database |
| `backend` | `axelnyman/balance-backend:1.0.1` | 8080 | Spring Boot API |
| `frontend` | Built from `Dockerfile.dev` | 5173 | React frontend (dev) |
| `adminer` | `adminer` | 8081 | Database admin UI |

**Frontend service configuration**:
```yaml
frontend:
  build:
    context: .
    dockerfile: Dockerfile.dev
  volumes:
    - .:/app
    - /app/node_modules
  environment:
    - VITE_API_URL=http://localhost:8080
    - API_PROXY_TARGET=http://backend:8080
```

**Key features**:
- Volume mount enables hot reload without rebuild
- Anonymous volume preserves `node_modules` from image
- `API_PROXY_TARGET` used by Vite proxy to forward `/api/*` requests

---

### Runtime Configuration

#### nginx.conf.template (`nginx.conf.template`)

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass ${BACKEND_URL}/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Features**:
- SPA routing via `try_files` (returns `index.html` for unknown routes)
- API proxy with `${BACKEND_URL}` placeholder
- Gzip compression enabled
- Static asset caching (1 year)

#### docker-entrypoint.sh

```bash
#!/bin/sh
set -e
BACKEND_URL=${BACKEND_URL:-http://backend:8080}
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
```

**Behavior**:
- Defaults `BACKEND_URL` to `http://backend:8080` (Docker service name)
- Uses `envsubst` to inject runtime configuration
- Only substitutes `BACKEND_URL` (avoids replacing nginx variables like `$uri`)
- Uses `exec` for proper signal handling

---

### .dockerignore Configuration

```
node_modules
dist
.git
.gitignore
.env
.env.local
.env.*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
.idea
.vscode
*.md
!README.md
todo
ux-flows
.claude
```

**Key exclusions**:
- `node_modules` and `dist` (rebuilt in container)
- Environment files (`.env*`)
- IDE and OS files
- Documentation (except README.md)
- Claude thoughts directory

---

### CI/CD Pipeline for Docker Publishing

#### GitHub Actions Workflows

Two workflows handle CI/CD:

**1. CI Workflow (`.github/workflows/ci.yml`)**

Runs on: Push to `main`, all PRs

```yaml
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test -- --run
      - run: npm run build
      - uses: actions/upload-artifact@v4
```

**Purpose**: Validates code quality before releases

**2. Release Workflow (`.github/workflows/release.yml`)**

Runs on: Push to `main`

```yaml
jobs:
  release-please:
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
      version: ${{ steps.release.outputs.version }}
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json

  docker:
    needs: release-please
    if: ${{ needs.release-please.outputs.release_created }}
    steps:
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
      - uses: docker/metadata-action@v5
      - uses: docker/build-push-action@v6
```

**Release flow**:
1. release-please analyzes commits and creates/updates Release PR
2. Merging Release PR creates Git tag and triggers `release_created`
3. Docker job builds and pushes image with semver tags

---

### Docker Hub Publishing

#### Image Location

`axelnyman/balance-frontend`

#### Tag Strategy

When version `1.2.3` is released, these tags are created:

| Tag | Description |
|-----|-------------|
| `1.2.3` | Exact version |
| `1.2` | Minor version (receives patch updates) |
| `1` | Major version (receives minor/patch updates) |
| `latest` | Most recent release |

#### Docker Metadata Action Configuration

```yaml
- uses: docker/metadata-action@v5
  with:
    images: axelnyman/balance-frontend
    tags: |
      type=semver,pattern={{version}},value=v${{ needs.release-please.outputs.version }}
      type=semver,pattern={{major}}.{{minor}},value=v${{ needs.release-please.outputs.version }}
      type=semver,pattern={{major}},value=v${{ needs.release-please.outputs.version }}
    flavor: |
      latest=auto
```

#### Build Optimization

```yaml
- uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Features**:
- GitHub Actions cache for layer caching
- Multi-tag push in single operation

---

### Automated Versioning

#### release-please Configuration

**Manifest** (`.release-please-manifest.json`):
```json
{
  ".": "1.1.1"
}
```

**Config** (`release-please-config.json`):
```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "changelog-sections": [
        { "type": "feat", "section": "Features" },
        { "type": "fix", "section": "Bug Fixes" },
        { "type": "perf", "section": "Performance Improvements" },
        { "type": "refactor", "section": "Code Refactoring" },
        { "type": "docs", "section": "Documentation", "hidden": true },
        { "type": "chore", "section": "Miscellaneous", "hidden": true },
        { "type": "test", "section": "Tests", "hidden": true }
      ]
    }
  }
}
```

#### Version Bump Rules

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `fix:` | PATCH | 1.0.0 → 1.0.1 |
| `feat:` | MINOR | 1.0.0 → 1.1.0 |
| `feat!:` / `BREAKING CHANGE:` | MAJOR | 1.0.0 → 2.0.0 |

---

### GitHub Secrets Required

| Secret | Purpose |
|--------|---------|
| `DOCKER_USERNAME` | Docker Hub username (`axelnyman`) |
| `DOCKER_TOKEN` | Docker Hub access token |

---

### Current Version

As of this research, the current version is **1.1.1** (per `.release-please-manifest.json`).

---

## Architecture Documentation

### Production Deployment Architecture

```
┌──────────────┐     /api/*      ┌─────────────────┐     ┌─────────────┐
│   Browser    │ ──────────────► │    nginx        │ ──► │   Backend   │
│              │                 │    :80          │     │    :8080    │
│              │ ◄────────────── │  (static +      │     │             │
└──────────────┘   HTML/JS/CSS   │   proxy)        │     └─────────────┘
                                 └─────────────────┘
```

### CI/CD Pipeline Flow

```
Push to main
     │
     ├──► CI Workflow (ci.yml)
     │    └──► lint → typecheck → test → build
     │
     └──► Release Workflow (release.yml)
          │
          ├──► release-please
          │    └──► Creates/updates Release PR
          │
          └──► (on Release PR merge)
               └──► Docker job
                    └──► Build → Tag → Push to Docker Hub
```

---

## Code References

- `Dockerfile:1-36` - Production multi-stage build
- `Dockerfile.dev:1-18` - Development configuration
- `docker-compose.yml:1-61` - Development stack
- `.dockerignore:1-18` - Build context exclusions
- `docker-entrypoint.sh:1-11` - Runtime config injection
- `nginx.conf.template:1-30` - nginx configuration
- `.github/workflows/release.yml:25-61` - Docker publishing job
- `.github/workflows/ci.yml:1-47` - CI pipeline
- `release-please-config.json:1-18` - Version configuration
- `.release-please-manifest.json:1-3` - Current version tracking

---

## Historical Context (from thoughts/)

- `.claude/thoughts/research/2026-01-03-frontend-docker-deployment.md` - Initial research on Docker deployment patterns
- `.claude/thoughts/plans/2026-01-04-production-docker-deployment.md` - Implementation plan for production Docker
- `.claude/thoughts/research/2026-01-03-github-actions-cicd.md` - CI/CD research including Docker Hub publishing
- `.claude/thoughts/plans/2026-01-04-github-actions-cicd.md` - Implementation plan for GitHub Actions

---

## Usage Examples

### Local Development

```bash
# Start full development stack
docker compose up

# Access points:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:8080
# - Adminer: http://localhost:8081
```

### Build Production Image Locally

```bash
docker build -t balance-frontend .
docker run -d -p 80:80 -e BACKEND_URL=http://host.docker.internal:8080 balance-frontend
```

### Pull from Docker Hub

```bash
docker pull axelnyman/balance-frontend:latest
docker pull axelnyman/balance-frontend:1.1.1
```

### Production Docker Compose

```yaml
services:
  frontend:
    image: axelnyman/balance-frontend:latest
    ports:
      - "80:80"
    environment:
      - BACKEND_URL=http://backend:8080
    depends_on:
      - backend
```

---

## Open Questions

None - the Docker configuration is complete and well-documented.
