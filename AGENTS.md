## Overview

**Devex** is a **Kubernetes-powered, AI-augmented Cloud Development Environment** that provides secure, isolated, and shareable development sandboxes (“REPL containers”) for running code, experiments, and workflows.

Each sandbox is a Kubernetes Deployment containing:

* **Runner Service** – the main process that manages terminal sessions (WebSockets + PTY) for connected web clients.
* **MCP Server Sidecar** – an [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes APIs, tools, and environment controls to AI agents.

This architecture allows both **human developers** and **autonomous AI agents** to code, run, and manage resources inside the container, securely and at scale.

---

## Key Concepts

### 1. Runner Service

* Handles interactive sessions between the user’s browser and the container using WebSockets.
* Bridges the PTY (pseudo-terminal) with the frontend terminal UI.
* Can receive commands from AI agents via the MCP Server.

### 2. MCP Server

* Runs as a **sidecar** container within the same Kubernetes Pod as the Runner.
* Provides AI agents with:

  * Command execution
  * File system manipulation
  * Environment inspection
  * Build/run capabilities
* Communicates with the Runner Service via **gRPC** for low-latency, structured interaction.

### 3. Kubernetes Integration

* Each REPL is a dynamic Kubernetes Deployment with:

  * **Runner container**
  * **MCP sidecar container**
* Sandboxes are ephemeral by default but can be made persistent for collaboration.
* Scales horizontally for multiple concurrent sandboxes and AI agents.

---

## How AI Agents Interact

1. **Session Initialization**

   * AI Agent authenticates and connects to the MCP server endpoint for a given REPL instance.
   * The MCP server validates session and environment context.

2. **Command Execution**

   * Agent sends a structured request (via MCP) to execute a command or modify files.
   * MCP server proxies the request to the Runner via gRPC.

3. **State Retrieval**

   * Agent can request filesystem snapshots, process lists, or environment metadata.
   * Results are streamed back over the MCP protocol.

4. **Lifecycle Management**

   * Agents can trigger builds, run tasks, or request container teardown (if allowed).
   * Sandbox auto-shutdown occurs after inactivity.

---

## Example Agent Workflow

1. **Agent Request**:

   > “Create a new Python file `main.py` and run it.”

2. **MCP Server**:

   * Writes `main.py` to the Runner’s filesystem.
   * Executes `python main.py` inside the PTY.

3. **Runner**:

   * Streams output back to the MCP server.
   * MCP sends results to the AI agent in real-time.

---

## Security Model

* Each sandbox is fully isolated in its own Kubernetes Pod.
* No shared filesystem between sandboxes unless explicitly configured.
* MCP actions are restricted to the container’s namespace and role-based permissions.
* All communication uses TLS within the cluster.

---

## Future Extensions

* **SSH Access for Agents** – allowing remote agent login into sandboxes.
* **Multi-agent Collaboration** – multiple agents/humans interacting in the same REPL.
* **Resource Limits** – dynamic CPU/memory quota adjustments.
* **Persistent Volumes** – keep work between restarts.

---

## Quick Reference

| Component          | Purpose                               | Tech Stack          |
| ------------------ | ------------------------------------- | ------------------- |
| Runner Service     | WebSocket/PTy bridge to frontend      | Go, xterm.js        |
| MCP Server Sidecar | Agent tool interface + gRPC to Runner | Go, MCP Protocol    |
| Kubernetes         | Orchestration + isolation             | Deployments, Pods   |
| Frontend           | Terminal & IDE interface              | Next.js, WebSockets |

