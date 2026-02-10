# Devex Agent Guide

**Summary**
Devex is a cloud development IDE with sandboxed “repl” sessions. The system is split into services. The core service handles auth and session orchestration, while the runner provides the interactive sandbox (WebSocket + PTY). Session data is persisted to S3-compatible storage when a repl is deactivated.

**Architecture (High Level)**
- Core service (`apps/core`) is deployed to a VPS via Docker Swarm and is the control plane.
- Runner service (`apps/runner`) is the data plane sandbox image. Each repl is a Kubernetes Deployment with a single pod.
- Pod layout:
  - `initContainer` pulls workspace files from S3.
  - `runnerContainer` is the interactive sandbox (WebSocket + PTY).
- Deactivation flow:
  - Core injects an ephemeral container into the pod to upload workspace data to S3.
  - Core then deletes Deployment/Service/Ingress/Middleware.
- Routing:
  - Base host: `repl.parthkapoor.me`
  - Route pattern: `repl.parthkapoor.me/<repl-id>/<route>`
  - Uses `hostNetwork: true` to avoid a load balancer and save cost.

**Key Entry Points**
- Core API: `apps/core/cmd/main.go`
- Runner API: `apps/runner/cmd/main.go`
- MCP service: `apps/mcp/cmd/main.go`

**Repo Layout**
- `apps/core/`: Control-plane service (auth + session orchestration + k8s + s3 + redis).
- `apps/runner/`: Sandbox service (WebSocket, PTY, file operations, shutdown manager).
- `apps/mcp/`: MCP server.
- `apps/web/`: Frontend web app.
- `apps/agent/`: Agent-related app (check README inside).
- `packages/`: Shared Go packages and generated protobufs.
  - `packages/logging`: Shared logger wrapper.
  - `packages/proto` + `packages/pb`: Proto sources and generated code.
- `infra/`: Deployment and infrastructure.
  - `infra/core/`: Swarm dockerfile + stack config.
  - `infra/runner/`: Runner dockerfiles (base + language variants).
  - `infra/mcp/`: MCP dockerfile.
  - `infra/k8s/`: K8s manifests, cert-manager, ingress, traefik.
- `templates/`: Repl templates synced to object storage.

**Data Stores**
- Redis: repl/session state.
- S3-compatible storage: workspace persistence on session end.

**Build and Test (Local)**
- Core build:
  - `cd apps/core`
  - `go build -o /tmp/core ./cmd/main.go`
- Runner build:
  - `cd apps/runner`
  - `go build -o /tmp/runner ./cmd/main.go`
- Docker images:
  - `docker build -f infra/core/dockerfile -t devex/core:local .`
  - `docker build -f infra/runner/dockerfile -t devex/runner:local .`

**CI/CD**
- Workflows live in `.github/workflows/`.
- Core pipeline builds/pushes and deploys via Docker Swarm.
- Runner pipeline builds runner + env images.
- Templates pipeline syncs `templates/` to DigitalOcean Spaces.

**Where to Look First**
- Auth/session logic: `apps/core/services/auth/`
- Repl lifecycle: `apps/core/services/repl/` and `apps/core/internal/k8s/`
- Runner WS/PTY: `apps/runner/pkg/ws/`, `apps/runner/pkg/pty/`
- Shared logging: `packages/logging/`

**Notes for Agents**
- The system relies on `hostNetwork: true` for simplicity and cost.
- The core service is the orchestrator; runner instances are ephemeral and created per repl session.
- If you change protobufs in `packages/proto/`, regenerate via `make generate-proto`.
