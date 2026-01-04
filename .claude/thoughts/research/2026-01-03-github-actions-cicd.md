---
date: 2026-01-03T12:00:00+01:00
researcher: Claude
git_commit: 6e40c32abf16359666c64aab017ab716efe23af2
branch: main
repository: balance-frontend
topic: "GitHub Actions CI/CD for Testing, Docker Hub Publishing, and Automated Versioning"
tags: [research, ci-cd, github-actions, docker, versioning, automated-releases]
status: complete
last_updated: 2026-01-03
last_updated_by: Claude
---

# Research: GitHub Actions CI/CD for Testing, Docker Hub Publishing, and Automated Versioning

**Date**: 2026-01-03T12:00:00+01:00
**Researcher**: Claude
**Git Commit**: 6e40c32abf16359666c64aab017ab716efe23af2
**Branch**: main
**Repository**: balance-frontend

## Research Question

How could this codebase implement GitHub CI/CD actions for:

1. Automated testing
2. Pushing to Docker Hub
3. Best practices for when to push (all commits to main vs something else)
4. Automated versioning

## Summary

This codebase is well-positioned for CI/CD implementation:

- **Testing**: Vitest with comprehensive test coverage, MSW mocking, React Testing Library
- **Docker**: Production Dockerfile exists (`Dockerfile`)
- **CI/CD**: No existing configuration - greenfield opportunity

**Recommended Strategy**:

- **Testing**: Run on every push to main and all PRs
- **Docker Publishing**: Publish on Git tags (semver), not on every commit
- **Versioning**: Use Conventional Commits + release-please for controlled releases with PR review

---

## Current Codebase State

### Docker Setup

**Files Present**:

- `Dockerfile.dev` - Development-only (Vite dev server with hot reload)
- `Dockerfile` - Production Dockerfile (multi-stage build with nginx)
- `docker-compose.yml` - 4 services for dev testing: db, backend, frontend, adminer
- `.dockerignore` - Properly configured

**What's Missing for Production**:

- Production docker-compose configuration (although instructions are available in `DEPLOYMENT.md`)

**Backend Image**: Already published to Docker Hub as `axelnyman/balance-backend:1.0.1`

### Testing Setup

**Test Runner**: Vitest (`vitest.config.ts`)

**Test Scripts** (package.json):

```json
"test": "vitest"           // Watch mode
"test:ui": "vitest --ui"   // Visual UI
"test:coverage": "vitest --coverage"
```

**Libraries**:

- `@testing-library/react` - Component testing
- `@testing-library/jest-dom` - DOM matchers
- `@testing-library/user-event` - User interactions
- `msw` - API mocking

**Test Files**: Colocated with source (`*.test.tsx`), comprehensive coverage across:

- Components (shared, layout, accounts, budgets, todo, wizard)
- Hooks (`use-todo.test.tsx`)
- API client (`client.test.ts`)
- Utilities (`utils.test.ts`)

### CI/CD Status

**Current**: No `.github/workflows/` directory or CI configuration exists.

---

## Recommended Implementation

### 1. Workflow Triggers - When to Run What

```yaml
# CI (Test + Build) - Run frequently
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

# Docker Publishing - Run on releases only
on:
  push:
    tags:
      - 'v*.*.*'
```

**Best Practices**:

- **Tests on every push to main** - Catch regressions immediately
- **Tests on all PRs** - Gate merges on passing tests
- **Docker publish on tags only** - Deliberate releases, not every commit
- **Use path filtering** - Skip CI for docs-only changes

```yaml
on:
  push:
    paths-ignore:
      - "**.md"
      - "docs/**"
```

### 2. Testing Workflow

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ startsWith(github.ref, 'refs/pull/') }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v6
        with:
          node-version: 20
          cache: "npm"

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test -- --run --reporter=default --reporter=github-actions

      - name: Build
        run: npm run build
```

**Key Points**:

- `npm ci` (not `npm install`) - Uses lockfile, faster in CI
- `--run` flag - Runs tests once (no watch mode)
- `--reporter=github-actions` - Creates annotations on PR failures
- Concurrency control - Cancels in-progress PR jobs on new pushes

### 3. Docker Hub Publishing Workflow

**Prerequisites**:

1. Set up GitHub Secrets:
   - `DOCKER_USERNAME` - Docker Hub username
   - `DOCKER_TOKEN` - Docker Hub access token (not password)

```yaml
name: Docker Publish

on:
  push:
    tags:
      - "v*.*.*"

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

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
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
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

**Tag Strategy** (when you push `v1.2.3`):

- `axelnyman/balance-frontend:1.2.3` - Exact version
- `axelnyman/balance-frontend:1.2` - Minor version (gets patch updates)
- `axelnyman/balance-frontend:1` - Major version (gets minor/patch updates)
- `axelnyman/balance-frontend:latest` - Latest stable

### 4. Automated Versioning with release-please

**Why release-please over semantic-release**:

- PR-based workflow - Review changes before release
- Maintains Release PR that updates with each merge
- Google-backed, well-maintained

**Setup**:

1. **Install commitlint + Husky** (enforce commit format):

```bash
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

2. **Create `commitlint.config.js`**:

```javascript
module.exports = { extends: ["@commitlint/config-conventional"] };
```

3. **Create `.github/workflows/release-please.yml`**:

```yaml
name: Release Please

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
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          release-type: node
```

4. **Chain Docker publish to releases**:

```yaml
docker:
  needs: release-please
  if: ${{ needs.release-please.outputs.release_created }}
  runs-on: ubuntu-latest
  steps:
    # ... docker build and push steps
```

**How It Works**:

1. Use Conventional Commits: `feat:`, `fix:`, `feat!:` (breaking)
2. release-please creates/updates a "Release PR"
3. Merge the PR when ready to release
4. Git tag created automatically, triggers Docker publish

**Commit Type → Version Bump**:
| Commit | Version Bump | Example |
|--------|--------------|---------|
| `fix:` | PATCH | 1.0.0 → 1.0.1 |
| `feat:` | MINOR | 1.0.0 → 1.1.0 |
| `feat!:` or `BREAKING CHANGE:` | MAJOR | 1.0.0 → 2.0.0 |

---

## Complete Workflow Files

### `.github/workflows/ci.yml`

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
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v6
        with:
          node-version: 20
          cache: "npm"

      - run: npm ci

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

### `.github/workflows/release.yml`

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
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          release-type: node

  docker:
    needs: release-please
    if: ${{ needs.release-please.outputs.release_created }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

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

---

## Implementation Checklist

### Phase 1: Testing CI (Quick Win)

- [ ] Create `.github/workflows/ci.yml`
- [ ] Verify tests pass locally first
- [ ] Push and verify GitHub Actions runs

### Phase 2: Docker Publishing

- [ ] Create Docker Hub repository
- [ ] Create Docker Hub access token
- [ ] Add `DOCKER_USERNAME` and `DOCKER_TOKEN` to GitHub Secrets
- [ ] Create `.github/workflows/release.yml`
- [ ] Test with manual tag: `git tag v0.1.0 && git push --tags`

### Phase 3: Automated Versioning

- [ ] Install commitlint + Husky
- [ ] Create `commitlint.config.js`
- [ ] Update release workflow with release-please
- [ ] Adopt Conventional Commits in team workflow

---

## Answers to Specific Questions

### Should we push on all commits to main?

**No.** Best practice is:

- **Tests/Build**: Run on every commit to main and all PRs
- **Docker Publish**: Only on Git tags (releases)

Reasons:

- Avoid Docker Hub clutter with hundreds of images
- Clear versioning with semver tags
- Deliberate releases allow QA before deployment

### Can versioning be automated?

**Yes.** Recommended approach:

1. **Conventional Commits** - Structured commit messages (`feat:`, `fix:`)
2. **release-please** - Creates Release PRs automatically
3. **Workflow chain** - Merged release → Git tag → Docker publish

This gives you:

- Automated version bumps based on commits
- Auto-generated changelogs
- Human review before each release
- Tagged Docker images matching Git versions

---

## Sources

### GitHub Actions

- [GitHub Docs - Triggering a Workflow](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow)
- [GitHub Docs - Dependency Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [GitHub Docs - Control Workflow Concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

### Docker Publishing

- [Docker Docs - GitHub Actions](https://docs.docker.com/build/ci/github-actions/)
- [docker/build-push-action](https://github.com/docker/build-push-action)
- [docker/metadata-action](https://github.com/docker/metadata-action)
- [GitHub Docs - Publishing Docker Images](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)

### Versioning

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/)
- [release-please GitHub](https://github.com/googleapis/release-please)
- [commitlint Documentation](https://commitlint.js.org/)

### Testing

- [Vitest Guide - Reporters](https://vitest.dev/guide/reporters)
- [Steve Kinney - Setting Up Vitest in GitHub Actions](https://stevekinney.com/courses/testing/continuous-integration)

---

## Related Research

- `.claude/thoughts/research/2026-01-03-frontend-docker-deployment.md` - Production Docker architecture details
