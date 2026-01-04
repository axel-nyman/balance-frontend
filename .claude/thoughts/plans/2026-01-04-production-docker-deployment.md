# Production Docker Deployment Implementation Plan

## Overview

Create production Docker configuration for the Balance frontend, enabling deployment via Docker Hub and Docker Compose. The frontend will be served by nginx with runtime-configurable backend URL using `envsubst`.

## Current State Analysis

**What exists:**
- `Dockerfile.dev` - Development-only (Vite dev server)
- `docker-compose.yml` - Development setup with 4 services
- `.dockerignore` - Properly configured
- Hardcoded API path `/api` in `src/api/client.ts:1`

**What's missing:**
- Production `Dockerfile`
- `nginx.conf` for static serving + API proxy
- Deployment documentation

### Key Discovery

The frontend uses hardcoded `/api` path (`src/api/client.ts:1`), meaning nginx must proxy `/api/*` requests to the backend. No build-time environment variables needed.

## Desired End State

After this plan is complete:
1. A production Docker image can be built with `docker build -t balance-frontend .`
2. The image serves the React app via nginx on port 80
3. Backend URL is configurable at runtime via `BACKEND_URL` environment variable
4. `DEPLOYMENT.md` documents how to deploy with docker-compose

**Verification:**
- Build image locally and run with `docker run -p 80:80 -e BACKEND_URL=http://localhost:8080 balance-frontend`
- Verify static files served at `http://localhost/`
- Verify SPA routing works (refresh on `/budgets` returns app, not 404)

## What We're NOT Doing

- Complete production docker-compose.yml file (just template/instructions)
- Health checks for frontend container
- CI/CD pipeline setup (covered in separate research)
- Versioning configuration

## Implementation Approach

1. Create nginx configuration template with `$BACKEND_URL` placeholder
2. Create entrypoint script that runs `envsubst` to inject runtime config
3. Create multi-stage Dockerfile (build with Node, serve with nginx)
4. Document deployment in `DEPLOYMENT.md`

---

## Phase 1: Create nginx Configuration

### Overview
Create nginx config that serves static files, handles SPA routing, and proxies API requests.

### Changes Required:

#### 1. Create nginx.conf.template
**File**: `nginx.conf.template` (new file)

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass ${BACKEND_URL}/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Notes:**
- Uses `${BACKEND_URL}` placeholder for envsubst
- `try_files` handles SPA routing (returns index.html for unknown routes)
- Static asset caching for performance

### Success Criteria:

#### Automated Verification:
- [x] File exists: `ls nginx.conf.template`
- [x] Contains BACKEND_URL placeholder: `grep 'BACKEND_URL' nginx.conf.template`

#### Manual Verification:
- [ ] Review nginx config syntax is correct

---

## Phase 2: Create Entrypoint Script

### Overview
Create shell script that substitutes environment variables into nginx config at container startup.

### Changes Required:

#### 1. Create docker-entrypoint.sh
**File**: `docker-entrypoint.sh` (new file)

```bash
#!/bin/sh
set -e

# Default backend URL if not provided
BACKEND_URL=${BACKEND_URL:-http://backend:8080}

# Substitute environment variables in nginx config
envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'
```

**Notes:**
- Default `BACKEND_URL` is `http://backend:8080` (Docker Compose service name)
- Only substitutes `BACKEND_URL` to avoid replacing nginx's own `$uri` etc.
- Uses `exec` to replace shell with nginx (proper signal handling)

### Success Criteria:

#### Automated Verification:
- [x] File exists: `ls docker-entrypoint.sh`
- [x] File is executable after build (verified in Phase 3)

#### Manual Verification:
- [ ] Script logic is correct

---

## Phase 3: Create Production Dockerfile

### Overview
Create multi-stage Dockerfile that builds the React app and serves it with nginx.

### Changes Required:

#### 1. Create Dockerfile
**File**: `Dockerfile` (new file)

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
```

**Notes:**
- Multi-stage build keeps final image small (~25MB vs ~300MB)
- Uses `npm ci` for reproducible builds
- nginx:alpine is minimal and secure

### Success Criteria:

#### Automated Verification:
- [x] Build succeeds: `docker build -t balance-frontend .`
- [x] Image size is reasonable: `docker images balance-frontend` (82MB - includes JS bundle)

#### Manual Verification:
- [x] Container starts: `docker run -d -p 8888:80 -e BACKEND_URL=http://host.docker.internal:8080 --name test-frontend balance-frontend`
- [x] Static files served: `curl http://localhost:8888/` returns HTML
- [x] SPA routing works: `curl http://localhost:8888/budgets` returns HTML (not 404)
- [x] Cleanup: `docker stop test-frontend && docker rm test-frontend`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Create Deployment Documentation

### Overview
Document how to deploy the frontend with docker-compose, including environment configuration.

### Changes Required:

#### 1. Create DEPLOYMENT.md
**File**: `DEPLOYMENT.md` (new file)

```markdown
# Deployment Guide

This guide explains how to deploy the Balance frontend using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Backend API running (see [balance-backend](https://hub.docker.com/r/axelnyman/balance-backend))

## Quick Start

### Option 1: Docker Compose (Recommended)

Create a `docker-compose.yml` file:

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

  backend:
    image: axelnyman/balance-backend:latest
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=jdbc:postgresql://db:5432/mydatabase
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydatabase
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:

```bash
docker compose up -d
```

Access the application at http://localhost

### Option 2: Standalone Docker

If you have the backend running elsewhere:

```bash
docker run -d \
  -p 80:80 \
  -e BACKEND_URL=http://your-backend-url:8080 \
  --name balance-frontend \
  axelnyman/balance-frontend:latest
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://backend:8080` | URL of the backend API service |

### Ports

| Port | Description |
|------|-------------|
| 80 | HTTP (nginx) |

## Architecture

```
┌──────────────┐     /api/*      ┌─────────────────┐     ┌─────────────┐
│   Browser    │ ──────────────► │    nginx        │ ──► │   Backend   │
│              │                 │    :80          │     │    :8080    │
│              │ ◄────────────── │  (static +      │     │             │
└──────────────┘   HTML/JS/CSS   │   proxy)        │     └─────────────┘
                                 └─────────────────┘
```

- Frontend serves static files and proxies `/api/*` requests to backend
- All services communicate over Docker's internal network
- Only frontend port (80) needs to be exposed publicly

## Building from Source

To build the Docker image locally:

```bash
# Build the image
docker build -t balance-frontend .

# Test locally
docker run -d -p 80:80 -e BACKEND_URL=http://host.docker.internal:8080 balance-frontend
```

## Troubleshooting

### API requests return 502 Bad Gateway

The frontend cannot reach the backend. Check:
1. `BACKEND_URL` is set correctly
2. Backend container is running: `docker ps`
3. Backend is accessible from frontend network

### Page refreshes show 404

This shouldn't happen with the default nginx config. Verify:
1. `nginx.conf.template` has `try_files $uri $uri/ /index.html;`
2. Container was built with the correct config

### Check nginx configuration

```bash
docker exec <container_name> cat /etc/nginx/conf.d/default.conf
```
```

### Success Criteria:

#### Automated Verification:
- [x] File exists: `ls DEPLOYMENT.md`

#### Manual Verification:
- [ ] Documentation is clear and complete
- [ ] Docker compose example is correct
- [ ] All commands work as documented

---

## Testing Strategy

### Local Testing:
1. Build image: `docker build -t balance-frontend .`
2. Run with test backend URL
3. Verify static serving and SPA routing
4. Verify API proxy (requires running backend)

### Integration Testing:
1. Use example docker-compose from DEPLOYMENT.md
2. Start full stack
3. Verify frontend loads and can communicate with backend

## Files Created

| File | Purpose |
|------|---------|
| `Dockerfile` | Production multi-stage build |
| `nginx.conf.template` | nginx configuration with envsubst placeholders |
| `docker-entrypoint.sh` | Runtime config injection script |
| `DEPLOYMENT.md` | Deployment documentation |

## References

- Research: `.claude/thoughts/research/2026-01-03-frontend-docker-deployment.md`
- CI/CD Research: `.claude/thoughts/research/2026-01-03-github-actions-cicd.md`
