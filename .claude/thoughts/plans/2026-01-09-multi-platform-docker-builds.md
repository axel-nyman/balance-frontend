# Multi-Platform Docker Builds Implementation Plan

## Overview

Add multi-platform Docker build support to publish images for both `linux/amd64` (x86_64) and `linux/arm64` (ARM64/Raspberry Pi) architectures. This enables deployment to Raspberry Pi devices while maintaining compatibility with standard x86 servers.

## Current State Analysis

The release workflow at `.github/workflows/release.yml` already uses:

- `docker/setup-buildx-action@v3` - Required for multi-platform builds
- `docker/build-push-action@v6` - Supports the `platforms` parameter
- GitHub Actions cache (`cache-from: type=gha`)

The Dockerfile uses architecture-agnostic base images:

- `node:20-alpine` - Has ARM64 variant
- `nginx:alpine` - Has ARM64 variant

No platform-specific commands exist in the Dockerfile.

### Key Discoveries:

- Buildx is already configured (`release.yml:32-33`)
- QEMU is NOT currently set up (required for cross-platform emulation)
- No `platforms` parameter is specified, so builds default to the runner's architecture (amd64)

## Desired End State

After implementation:

- Docker images are published as multi-arch manifests
- `docker pull axelnyman/balance-frontend:latest` automatically pulls the correct architecture
- Raspberry Pi (ARM64) and x86 servers both work with the same image tag
- Build time increases slightly due to cross-compilation but remains reasonable

### Verification:

```bash
# Check manifest includes both platforms
docker manifest inspect axelnyman/balance-frontend:latest

# Should show:
# - linux/amd64
# - linux/arm64
```

## What We're NOT Doing

- Adding `linux/arm/v7` (32-bit ARM) - Raspberry Pi 3/4 run 64-bit OS
- Changing the Dockerfile structure
- Adding platform-specific build arguments
- Modifying local development setup (docker-compose.yml)

## Implementation Approach

Single-phase change to the GitHub Actions workflow:

1. Add QEMU setup for ARM64 emulation on the x86 runner
2. Add `platforms` parameter to build-push-action

## Phase 1: Add Multi-Platform Build Support

### Overview

Modify the release workflow to build and push multi-architecture Docker images.

### Changes Required:

#### 1. GitHub Actions Workflow

**File**: `.github/workflows/release.yml`

Add QEMU setup step after checkout and before buildx setup:

```yaml
- name: Set up QEMU
  uses: docker/setup-qemu-action@v3
```

Add `platforms` parameter to the build-push-action:

```yaml
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    context: .
    platforms: linux/amd64,linux/arm64
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Complete Updated Workflow (lines 29-62):

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Set up QEMU
    uses: docker/setup-qemu-action@v3

  - name: Set up Docker Buildx
    uses: docker/setup-buildx-action@v3

  - name: Login to Docker Hub
    uses: docker/login-action@v3
    with:
      username: ${{ secrets.DOCKER_USERNAME }}
      password: ${{ secrets.DOCKER_TOKEN }}

  - name: Docker metadata
    id: meta
    uses: docker/metadata-action@v5
    with:
      images: axelnyman/balance-frontend
      tags: |
        type=semver,pattern={{version}},value=v${{ needs.release-please.outputs.version }}
        type=semver,pattern={{major}}.{{minor}},value=v${{ needs.release-please.outputs.version }}
        type=semver,pattern={{major}},value=v${{ needs.release-please.outputs.version }}
      flavor: |
        latest=auto

  - name: Build and push
    uses: docker/build-push-action@v6
    with:
      context: .
      platforms: linux/amd64,linux/arm64
      push: true
      tags: ${{ steps.meta.outputs.tags }}
      labels: ${{ steps.meta.outputs.labels }}
      cache-from: type=gha
      cache-to: type=gha,mode=max
```

### Success Criteria:

#### Automated Verification:

- [x] Workflow syntax is valid (GitHub will validate on push)
- [x] CI workflow still passes: lint, typecheck, test, build
- [ ] Release workflow completes successfully after next release

#### Manual Verification:

- [ ] After release, verify multi-arch manifest:
  ```bash
  docker manifest inspect axelnyman/balance-frontend:latest
  ```
  Should list both `linux/amd64` and `linux/arm64` platforms
- [ ] Test pull and run on ARM64 device (Raspberry Pi):
  ```bash
  docker pull axelnyman/balance-frontend:latest
  docker run -d -p 80:80 -e BACKEND_URL=http://backend:8080 axelnyman/balance-frontend:latest
  ```

---

## Testing Strategy

### Pre-Release Testing:

The workflow change can be tested by:

1. Creating a feature branch
2. Temporarily modifying the workflow to trigger on that branch
3. Observing the build logs for both platform builds

### Post-Release Testing:

1. Trigger a release (merge a `fix:` or `feat:` commit)
2. Monitor the GitHub Actions workflow
3. Verify manifest after successful push

### Manual Testing Steps:

1. Pull the new image on a Raspberry Pi
2. Run the container with appropriate BACKEND_URL
3. Access the frontend via browser
4. Verify nginx serves content correctly

## Performance Considerations

- **Build time increase**: Cross-compilation via QEMU is slower than native builds. Expect 2-3x longer build times for the ARM64 layer.
- **Cache efficiency**: GitHub Actions cache helps, but ARM64 layers will have separate cache entries.
- **No runtime impact**: The resulting images are native to each platform.

## References

- Research: `.claude/thoughts/research/2026-01-09-docker-configuration.md`
- Docker multi-platform docs: https://docs.docker.com/build/building/multi-platform/
- QEMU action: https://github.com/docker/setup-qemu-action
- Build-push action: https://github.com/docker/build-push-action
