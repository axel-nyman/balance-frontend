---
date: 2026-01-03T12:00:00+01:00
researcher: Claude
git_commit: 6e40c32abf16359666c64aab017ab716efe23af2
branch: main
repository: balance-frontend
topic: "Frontend Docker Hub and Docker Compose Deployment"
tags: [research, deployment, docker, docker-compose, nginx, environment-variables]
status: complete
last_updated: 2026-01-03
last_updated_by: Claude
---

# Research: Frontend Docker Hub and Docker Compose Deployment

**Date**: 2026-01-03T12:00:00+01:00
**Researcher**: Claude
**Git Commit**: 6e40c32abf16359666c64aab017ab716efe23af2
**Branch**: main
**Repository**: balance-frontend

## Research Question

How could this frontend codebase be deployed via Docker Hub and Docker Compose? What environment variables/configuration would be necessary? Focus specifically on the frontend and how it connects to the backend.

## Summary

The frontend currently only has a development Docker setup (`Dockerfile.dev`). For production deployment via Docker Hub, a production Dockerfile would need to be created. The key architectural consideration is that the API client uses **hardcoded relative paths** (`/api`), meaning the frontend expects the backend to be accessible at the same origin under the `/api` path. This requires either a reverse proxy (nginx) or same-origin deployment.

## Detailed Findings

### Current API Connection Pattern

The frontend uses a hardcoded API base path in the client:

**File**: `src/api/client.ts:1`
```typescript
const API_BASE = '/api'
```

All API functions use relative URLs:
- `fetch('/api/bank-accounts')`
- `fetch('/api/budgets')`
- `fetch('/api/recurring-expenses')`
- etc.

This means **no runtime API URL configuration is needed** — the frontend always sends requests to `/api/*` on its own origin.

### Current Development Docker Setup

**File**: `Dockerfile.dev`
- Uses `node:20-alpine` base image
- Runs Vite dev server on port 5173
- Intended for development only (hot reload, source maps)

**File**: `docker-compose.yml`
- Frontend runs from `Dockerfile.dev`
- Backend pulled from Docker Hub: `axelnyman/balance-backend:1.0.1`
- Environment variables (development):
  - `VITE_API_URL=http://localhost:8080` — **Not used in code**
  - `API_PROXY_TARGET=http://backend:8080` — Used by Vite proxy

**File**: `vite.config.ts:14-20`
```typescript
server: {
  proxy: {
    '/api': {
      target: process.env.API_PROXY_TARGET || 'http://localhost:8080',
      changeOrigin: true,
    },
  },
},
```

The Vite dev server proxies `/api` requests to the backend. This proxy only exists during development.

### Production Deployment Requirements

For production deployment, the frontend needs:

1. **A production Dockerfile** — Does not exist yet
2. **A web server** — To serve static files and proxy API requests
3. **No build-time environment variables** — The `/api` path is hardcoded

#### Proposed Production Dockerfile Structure

A production Dockerfile would typically:
1. Build static files with `npm run build` (outputs to `dist/`)
2. Serve files with nginx
3. Configure nginx to proxy `/api` requests to the backend

#### Required nginx Configuration

Since the frontend uses `/api` relative paths, nginx must:
1. Serve static files from `/`
2. Proxy `/api/*` requests to the backend service
3. Handle SPA routing (return `index.html` for unknown routes)

Example nginx.conf structure:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Environment Variables for Production

| Variable | Where Used | Purpose | Required |
|----------|-----------|---------|----------|
| `BACKEND_URL` | nginx.conf | Backend service URL for proxy | Yes (runtime) |

The key insight is that **no Vite/React build-time environment variables are needed** because the API path is hardcoded as `/api`. The only configuration needed is telling nginx where to proxy those requests.

#### Runtime Configuration Options

Option 1: **Hardcode backend URL in nginx.conf**
- Simple but inflexible
- Backend URL baked into image

Option 2: **Environment variable substitution at container startup**
- Use `envsubst` in entrypoint to replace `${BACKEND_URL}` in nginx.conf
- More flexible for different environments

### Docker Compose for Production

Example production docker-compose.yml structure:

```yaml
services:
  frontend:
    image: axelnyman/balance-frontend:1.0.0
    ports:
      - "80:80"
    environment:
      - BACKEND_URL=http://backend:8080
    depends_on:
      - backend

  backend:
    image: axelnyman/balance-backend:1.0.1
    # ... backend config (not in scope)

  db:
    # ... database config (not in scope)
```

### What Does NOT Need Configuration

- **`VITE_API_URL`**: Currently defined but never used in code
- **`API_PROXY_TARGET`**: Only used by Vite dev server (not in production)
- **Build-time API URL**: Not needed since `/api` is hardcoded

## Code References

- `src/api/client.ts:1` — API_BASE constant set to `/api`
- `vite.config.ts:14-20` — Development proxy configuration
- `Dockerfile.dev` — Development Docker configuration
- `docker-compose.yml:33-48` — Frontend service configuration

## Architecture Documentation

### Current Architecture (Development)

```
┌──────────────┐     /api/*      ┌─────────────────┐     ┌─────────────┐
│   Browser    │ ──────────────► │  Vite Dev       │ ──► │   Backend   │
│              │                 │  Server :5173   │     │    :8080    │
│              │ ◄────────────── │  (with proxy)   │     │             │
└──────────────┘   HTML/JS/CSS   └─────────────────┘     └─────────────┘
```

### Target Architecture (Production)

```
┌──────────────┐     /api/*      ┌─────────────────┐     ┌─────────────┐
│   Browser    │ ──────────────► │    nginx        │ ──► │   Backend   │
│              │                 │    :80          │     │    :8080    │
│              │ ◄────────────── │  (static +      │     │             │
└──────────────┘   HTML/JS/CSS   │   proxy)        │     └─────────────┘
                                 └─────────────────┘
                                   ▲
                                   │ serves from
                                   ▼
                                 /dist/
                                 (built static files)
```

## Files That Would Need to Be Created

1. **`Dockerfile`** — Production multi-stage build
2. **`nginx.conf`** — Production nginx configuration
3. **`docker-compose.prod.yml`** — Production compose file (optional)

## Open Questions

1. Should the backend URL be configurable at runtime or build time?
2. Is there a preference for the nginx configuration approach (envsubst vs. hardcoded)?
3. Should health checks be configured for the frontend container?
