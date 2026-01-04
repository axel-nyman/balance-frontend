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
