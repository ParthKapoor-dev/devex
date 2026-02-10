# 📦 GitHub Actions Workflows

This folder contains CI/CD pipelines for the Devex project. Each workflow automates deployment and image publishing for various components.

## 🔐 Required Repository Secrets

Before using these workflows, make sure the following secrets are added under:
**GitHub Repo → Settings → Secrets → Actions**

| Secret Name               | Description                                 |
|--------------------------|---------------------------------------------|
| `DEPLOY_SSH_PRIVATE_KEY` | SSH private key for remote deploy user      |
| `DO_SPACES_KEY`          | Access key for DigitalOcean Spaces          |
| `DO_SPACES_SECRET`       | Secret key for DigitalOcean Spaces          |
| `DO_SPACES_BUCKET`       | Bucket name where templates will be synced  |
| `DO_SPACES_ENDPOINT`     | Endpoint URL for DigitalOcean Spaces        |

---

## 🧱 Workflows Summary

### `core-pipeline.yaml`

- **Triggers**: On changes in `apps/core/` or the workflow file itself.
- **What it does**:
  - Builds the Docker image for the Core service.
  - Pushes it to GHCR.
  - Deploys the updated Core service via Docker Stack to a remote VPS using SSH.

📄 See also: [`apps/core/DEPLOYMENT.md`](../../apps/core/DEPLOYMENT.md)

---

### `runner-pipeline.yaml`

- **Triggers**: On changes in `apps/runner/` or the workflow file.
- **What it does**:
  - Dynamically finds all Dockerfiles in `apps/runner/`.
  - Builds and pushes one Docker image per template runner to GHCR.
  - Tags each image with both `:latest` and the current `git sha`.

---

### `templates-pipeline.yaml`

- **Triggers**: On changes in any folder inside `templates/` _(excluding README files)_.
- **What it does**:
  - Checks if any individual template folder exceeds 8MB.
  - If all are within limits, syncs the `templates/` directory to DigitalOcean Spaces (S3-compatible).

---

### `cluster-availability-check.yaml`

- **Triggers**:
  - Scheduled every 12 hours (`00:00 UTC`, `12:00 UTC`)
  - Manual trigger via `workflow_dispatch`
- **What it does**:
  - Resolves DNS for `repl.parthkapoor.me`
  - Validates TLS certificate SAN contains `repl.parthkapoor.me`
  - Verifies HTTP root reachability (`http://repl.parthkapoor.me/`) to catch port `80` issues
  - Probes:
    - `https://repl.parthkapoor.me/test-repl`
    - `https://repl.parthkapoor.me/test-repl/anything`
  - Fails if status is not `200` or expected whoami markers are missing
  - Prints detailed diagnostics (DNS, TLS, headers, response tails) on failure

No additional repository secrets are required for this workflow.

---
