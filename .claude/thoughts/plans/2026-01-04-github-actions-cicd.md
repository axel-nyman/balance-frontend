# GitHub Actions CI/CD Implementation Plan

## Overview

Implement a complete CI/CD pipeline for the balance-frontend repository that:
1. Runs tests, linting, and builds on every push to main and all PRs
2. Publishes Docker images to Docker Hub on releases
3. Automates versioning using release-please with Conventional Commits

## Current State Analysis

**What exists:**
- Production Dockerfile (`Dockerfile`) - multi-stage build with nginx
- Comprehensive test suite using Vitest + React Testing Library + MSW
- Test scripts in package.json: `test`, `test:ui`, `test:coverage`
- Lint script: `npm run lint`
- Build script: `npm run build`
- No existing CI/CD configuration

**What's missing:**
- `.github/workflows/` directory
- CI workflow for testing
- Release workflow for Docker publishing
- Automated versioning setup

## Desired End State

After this plan is complete:
1. Every push to `main` and every PR triggers automated testing (lint, typecheck, test, build)
2. Merging a release-please PR automatically:
   - Creates a Git tag (e.g., `v1.0.0`)
   - Updates `package.json` version
   - Generates a CHANGELOG.md
   - Builds and pushes Docker image to `axelnyman/balance-frontend`
3. Docker images are tagged with semver versions (e.g., `1.0.0`, `1.0`, `1`, `latest`)

**Verification:**
- CI workflow runs and passes on a test PR
- Creating and merging a release PR triggers Docker publish
- Docker image is accessible at `docker pull axelnyman/balance-frontend:1.0.0`

## What We're NOT Doing

- **No commitlint/Husky** - Manual Conventional Commits without enforcement
- **No multi-arch builds** - Single architecture (linux/amd64) for simplicity
- **No staging environment** - Direct to production Docker Hub
- **No deployment automation** - Only image publishing (deployment is manual via docker-compose)

## Implementation Approach

Three sequential phases, each building on the previous:
1. **Phase 1**: CI Pipeline - Get tests running on GitHub Actions
2. **Phase 2**: Release Automation - Add release-please for versioning
3. **Phase 3**: Docker Publishing - Build and push images on release

---

## Phase 1: CI Pipeline

### Overview
Create the GitHub Actions workflow for automated testing. This runs on every push to main and all PRs.

### Changes Required:

#### 1. Create workflows directory
**Action**: Create `.github/workflows/` directory structure

#### 2. Create CI workflow
**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
    paths-ignore:
      - "**.md"
      - ".claude/**"
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ startsWith(github.ref, 'refs/pull/') }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test -- --run

      - name: Build
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7
```

### Success Criteria:

#### Automated Verification:
- [x] Workflow file exists at `.github/workflows/ci.yml`
- [x] Local tests pass: `npm test -- --run`
- [x] Local lint passes: `npm run lint`
- [x] Local typecheck passes: `npx tsc --noEmit`
- [x] Local build passes: `npm run build`

#### Manual Verification:
- [ ] Push to main triggers the CI workflow
- [ ] All jobs complete successfully (green checkmark on GitHub)
- [ ] Build artifact is uploaded and accessible

**Implementation Note**: After completing this phase, commit and push to main to verify the workflow runs. Wait for manual confirmation before proceeding to Phase 2.

---

## Phase 2: Release Automation with release-please

### Overview
Add release-please to automate version bumps and changelog generation. This creates a "Release PR" that accumulates changes and, when merged, creates a Git tag.

### Changes Required:

#### 1. Create release-please configuration
**File**: `.release-please-manifest.json`

```json
{
  ".": "1.0.0"
}
```

#### 2. Create release-please config
**File**: `release-please-config.json`

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "bump-minor-pre-major": false,
      "bump-patch-for-minor-pre-major": false,
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

#### 3. Create release workflow
**File**: `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
      tag_name: ${{ steps.release.outputs.tag_name }}
      version: ${{ steps.release.outputs.version }}
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

### Success Criteria:

#### Automated Verification:
- [ ] `.release-please-manifest.json` exists with version `"1.0.0"`
- [ ] `release-please-config.json` exists with proper configuration
- [ ] `.github/workflows/release.yml` exists

#### Manual Verification:
- [ ] Push to main triggers the Release workflow
- [ ] Release-please creates a "Release PR" (or updates existing one)
- [ ] The Release PR shows correct version bump based on commit types

**Implementation Note**: After completing this phase, push a commit with `feat:` prefix to verify release-please creates a Release PR. Do NOT merge the Release PR yet - wait for Phase 3 to add Docker publishing.

---

## Phase 3: Docker Publishing

### Overview
Add Docker build and push job to the release workflow. This job runs only when a release is created (when the Release PR is merged).

### Prerequisites (Manual Setup Required):
1. **Create Docker Hub access token**:
   - Go to https://hub.docker.com/settings/security
   - Click "New Access Token"
   - Name: `github-actions-balance-frontend`
   - Permissions: Read & Write
   - Copy the token (shown only once)

2. **Add GitHub repository secrets**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add secret: `DOCKER_USERNAME` = `axelnyman`
   - Add secret: `DOCKER_TOKEN` = (the token from step 1)

### Changes Required:

#### 1. Update release workflow with Docker job
**File**: `.github/workflows/release.yml` (update)

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
      tag_name: ${{ steps.release.outputs.tag_name }}
      version: ${{ steps.release.outputs.version }}
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json

  docker:
    needs: release-please
    if: ${{ needs.release-please.outputs.release_created }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

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
            type=semver,pattern={{version}},value=${{ needs.release-please.outputs.tag_name }}
            type=semver,pattern={{major}}.{{minor}},value=${{ needs.release-please.outputs.tag_name }}
            type=semver,pattern={{major}},value=${{ needs.release-please.outputs.tag_name }}
          flavor: |
            latest=auto

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Success Criteria:

#### Automated Verification:
- [ ] Updated `.github/workflows/release.yml` contains the `docker` job
- [ ] Docker build works locally: `docker build -t balance-frontend:test .`

#### Manual Verification:
- [ ] GitHub Secrets are configured (`DOCKER_USERNAME`, `DOCKER_TOKEN`)
- [ ] Merging the Release PR triggers the Docker job
- [ ] Docker image is pushed to Docker Hub with correct tags
- [ ] Image is pullable: `docker pull axelnyman/balance-frontend:1.0.0`

**Implementation Note**: Complete the prerequisites (Docker Hub token, GitHub secrets) before merging the Release PR. Once secrets are configured, merge the Release PR to trigger the first release.

---

## Testing Strategy

### Local Verification (before pushing):
```bash
# Verify all CI checks pass locally
npm run lint
npx tsc --noEmit
npm test -- --run
npm run build

# Verify Docker build works
docker build -t balance-frontend:test .
```

### CI Verification:
1. Push Phase 1 changes → Verify CI workflow runs
2. Push Phase 2 changes → Verify release-please creates PR
3. Configure secrets, push Phase 3 changes → Merge Release PR → Verify Docker publish

### End-to-End Verification:
After all phases complete:
1. Make a change with `feat: add new feature` commit message
2. Push to main
3. Verify release-please updates the Release PR with new version
4. Merge Release PR
5. Verify Docker image is published with new version tag

---

## Conventional Commits Reference

Since we're not enforcing commits with tooling, here's a quick reference for manual use:

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat:` | New feature | MINOR (1.0.0 → 1.1.0) |
| `fix:` | Bug fix | PATCH (1.0.0 → 1.0.1) |
| `feat!:` or `BREAKING CHANGE:` | Breaking change | MAJOR (1.0.0 → 2.0.0) |
| `docs:` | Documentation only | No release |
| `chore:` | Maintenance | No release |
| `test:` | Tests only | No release |
| `refactor:` | Code refactoring | No release |
| `perf:` | Performance improvement | PATCH |

**Examples:**
```
feat: add budget export functionality
fix: correct currency formatting in totals
feat!: change API response format for budgets
docs: update README with deployment instructions
chore: update dependencies
```

---

## Rollback Plan

If something goes wrong:

1. **CI failing**: Revert the workflow file or fix the issue
2. **Release-please misconfigured**: Delete the Release PR, fix config, push again
3. **Docker publish fails**: Check secrets, verify Dockerfile builds locally
4. **Wrong version published**: Cannot unpublish, but can publish corrected version

---

## File Summary

Files to create:
- `.github/workflows/ci.yml` - CI pipeline
- `.github/workflows/release.yml` - Release + Docker publish
- `.release-please-manifest.json` - Version tracking
- `release-please-config.json` - Release configuration

Manual setup required:
- Docker Hub access token
- GitHub repository secrets (`DOCKER_USERNAME`, `DOCKER_TOKEN`)

---

## References

- Research document: `.claude/thoughts/research/2026-01-03-github-actions-cicd.md`
- Existing Dockerfile: `Dockerfile`
- Docker metadata action: https://github.com/docker/metadata-action
- Release-please action: https://github.com/googleapis/release-please-action
- Conventional Commits: https://www.conventionalcommits.org/
