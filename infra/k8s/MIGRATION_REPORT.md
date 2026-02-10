# Devex Kubernetes + Routing + TLS Migration Report

Date: 2026-02-10

## 1. Objective

Set up a fresh Kubernetes cluster for Devex REPL routing without an external load balancer, using:

- `repl.parthkapoor.me` DNS to cluster public node IP
- Path routing: `/<repl-id>/<route>` -> runner pod `/<route>`
- Traefik ingress with `hostNetwork: true`
- cert-manager for TLS (staging then production)

Also ensure local/dev and CI build paths stay healthy after shared logging integration.

## 2. Initial Constraints and Design Decisions

- No cloud `LoadBalancer` service due cost/complexity for this project.
- Use Traefik on node network ports `80/443` directly.
- Keep cert lifecycle on cert-manager (not Traefik native ACME).
- Preserve core expectations:
  - Cluster issuer name: `letsencrypt-cluster-issuer`
  - TLS secret name: `tls-secret`
  - Host: `RUNNER_CLUSTER_IP` (configured as `repl.parthkapoor.me`)

## 3. Build and CI Issues Encountered (Pre-K8s)

### Issue A: Core Docker build failed on missing `go.sum` entry

Symptom:

- `missing go.sum entry for module providing package github.com/charmbracelet/log`

Root cause:

- Shared package `packages/logging` added a dependency, but consuming module sums were not fully reconciled in Docker build context.

Fix applied:

- Run module tidy/download in the right module scopes and ensure generated sums are committed/present in build context.

### Issue B: Runner Docker build failed with unused import

Symptom:

- `cmd/api/api.go: "fmt" imported and not used`

Root cause:

- Logging migration left a stale import.

Fix applied:

- Remove unused import.

### Issue C: Local Docker core build asked for `go mod tidy`, while local `go build` worked

Symptom:

- Docker build: `updates to go.mod needed; to update it: go mod tidy`
- Local `go build` succeeded.

Root cause:

- Docker build runs in a stricter isolated context and can surface module graph/sum drift that local cache can mask.

Fix path:

- Run tidy in module(s), verify clean module files, rebuild from repo root context.

## 4. Kubernetes Bring-Up Issues and Fixes

### Issue D: Helm install error with hostNetwork + hostPort mismatch

Symptom:

- `ERROR: All hostPort must match their respective containerPort when hostNetwork is enabled`

Root cause:

- Traefik values had incompatible hostPort/container port relationship for hostNetwork mode.

Fix applied:

- Normalize Traefik port configuration so exposed host ports align correctly with container ports.

### Issue E: Traefik remained `Pending`

Symptom:

- Scheduler error: `didn't match Pod's node affinity/selector`

Root cause:

- `nodeSelector` expected `devex.ingress=true`, but pod scheduling and labels were not aligned during some revisions.

Fix applied:

- Confirm label on target node.
- Introduce explicit overlay values to pin Traefik to ingress node:
  - `infra/k8s/traefik-values-ingress-node.yaml`
- Re-upgrade with `--reset-values` + both values files.

Verification:

- Traefik pod scheduled on node with public IP `212.2.255.241`.

### Issue F: cert-manager webhook unavailable during issuer apply

Symptom:

- `failed calling webhook ... no endpoints available for service "cert-manager-webhook"`

Root cause:

- Issuer applied before cert-manager webhook became ready.

Fix applied:

- Add explicit readiness waits for all cert-manager deployments before applying issuers/certificates.

### Issue G: ACME challenge stuck (`no such host`)

Symptom:

- cert-manager self-check DNS lookup failed for `repl.parthkapoor.me` inside cluster.

Likely cause:

- Early DNS propagation/caching or temporary resolver path issue during initial bootstrap.

Fix path:

- Re-run after DNS settled and components healthy.
- Continue with explicit readiness checks and clean re-issuance flow.

### Issue H: ACME challenge stuck (`404`, expected `200`)

Symptom:

- cert-manager self-check reached endpoint but got `404`.

Root cause:

- Solver route not being served reliably due conflicting ingress state and stale ACME resources across retries.
- Prior Traefik ACME noise increased ambiguity.

Fix applied:

- Remove stale cert artifacts (`Certificate`, `Secret`, `Order`, `Challenge`, `CertificateRequest`), then re-apply issuer/certificate.
- Ensure Traefik native ACME args are removed.

### Issue I: ACME challenge stuck (`connection refused` on port 80)

Symptom:

- cert-manager self-check failed connecting to `212.2.255.241:80`.

Root cause:

- DNS pointed to public node, but Traefik was running on a different node without that public IP.

Why previous fixes did not work immediately:

- Configuration fixes were correct in isolation, but effective traffic path was still broken because scheduler placed Traefik on wrong node after upgrades.
- Until pod placement matched DNS target, HTTP-01 challenge could not pass.

Final fix:

- Pin Traefik to the DNS-target ingress node using labeled-node overlay.
- Re-run issuance flow.

## 5. Successful End State

All core objectives validated:

- Traefik running on ingress node with public IP.
- HTTP (`80`) reachable externally.
- HTTPS (`443`) reachable externally.
- Staging certificate issued successfully.
- Production certificate issued successfully.
- Certificate served by endpoint:
  - Issuer: Let’s Encrypt production (`R12` in observed output)
  - Subject: `CN=repl.parthkapoor.me`
- Path rewrite smoke test passed:
  - `/test-repl` -> backend `/`
  - `/test-repl/anything` -> backend `/anything`
- Core-service + web-app local testing confirmed working against cluster.

## 6. Infra/K8s Refactor Completed

Cleaned `infra/k8s` to keep only required assets and clearer names:

- Kept and normalized:
  - `traefik-values.yaml`
  - `traefik-values-ingress-node.yaml`
  - `cert-issuer-staging.yaml`
  - `cert-issuer-production.yaml`
  - `certificate-staging.yaml`
  - `certificate-production.yaml`
  - `smoke-test-whoami.yaml`
  - `SETUP_GUIDE.md`
  - `README.md`
- Removed obsolete/legacy files:
  - ingress-nginx manifest bundle
  - nginx-specific issuer
  - deprecated Traefik values alias
  - vendored cert-manager mega-manifest
  - duplicate checklist doc

## 7. Secret Dependency Note (S3 Upload/Download)

Cluster requires secret `aws-creds` in namespace `default` for:

- initContainer downloader (`s3-downloader`)
- ephemeral uploader on REPL deactivation

Secret keys expected by code:

- `access_key`
- `secret_key`

This was created during setup via `kubectl create secret generic aws-creds ...`.

## 8. Operational Lessons Learned

1. In no-LB hostNetwork design, pod placement is critical.
2. For HTTP-01 challenges, port `80` path from internet to Traefik must be continuously valid.
3. cert-manager resources should only be applied after webhook readiness.
4. Remove stale ACME resources before retrying after major ingress changes.
5. Keep one ACME owner (cert-manager), disable Traefik native ACME.

## 9. Current Risk/Follow-up Items

- Multi-node HA ingress is not configured yet (single ingress node design).
- Node replacement requires DNS/label strategy revalidation.
- Consider adding automated conformance checks in CI for manifest linting and schema validation.
- Consider adding runbook automation for certificate re-issuance cleanup flow.

