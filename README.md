<h1 align="center">⚡ DevEx – The Open Cloud IDE Platform</h1>

<p align="center">
  <b>Run full-featured, containerized dev environments in the cloud — with AI assistance and secure sandboxing.</b><br/>
  Scalable REPL sessions powered by Kubernetes, WebSockets, and GoLang.
</p>

<p align="center">
  <a href="https://github.com/ParthKapoor-dev/devex/stargazers">
    <img src="https://img.shields.io/github/stars/ParthKapoor-dev/devex?style=for-the-badge" />
  </a>
  <a href="https://github.com/ParthKapoor-dev/devex/issues">
    <img src="https://img.shields.io/github/issues/ParthKapoor-dev/devex?style=for-the-badge" />
  </a>
  <a href="https://github.com/ParthKapoor-dev/devex/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/ParthKapoor-dev/devex?style=for-the-badge" />
  </a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/parthkapoor-dev/devex/main/assets/devx.png" alt="Cloud Dev IDE Banner" />
</p>

---

DevEx is an open-source platform to spin up cloud-based development environments (REPLs) that work like your local setup — but in the browser, anywhere, anytime.

Built for flexibility, you can code in your preferred stack, connect over SSH, or run sessions with AI agents via our MCP server. We also support sandboxing AI-generated code securely, letting you test real changes in isolated environments.

Unlike Gitpod or E2B, DevEx is lightweight, self-hostable, and production-grade out of the box — with a developer-first CLI, seamless AI integration, and Kubernetes-native design for infinite scale.

> 📣 Want to add your own REPL template? It's easy!
> 👉 [Read the Contributing Guide](./CONTRIBUTING.md) to get started.

---

<p align="center">
  <a href="https://glama.ai/mcp/servers/@ParthKapoor-dev/devex">
    <img width="380" height="200" src="https://glama.ai/mcp/servers/@ParthKapoor-dev/devex/badge" />
  </a>
</p>

<p align="center"><b>🚀 MCP Server is now live at <a href="https://glama.ai">glama.ai</a> – enabling AI agents to interact directly with your REPLs!</b></p>


## ✨ Features

- 🔐 **GitHub OAuth** authentication
- 🪄 **Create, Start, Stop, Delete REPLs** via Core API
- 💾 **S3-backed file persistence**
- 📦 **Kubernetes Deployments per REPL** (Dynamic)
- 📡 **WebSocket-based Editor & Terminal**
- 🧹 **Ephemeral containers for cleanup and sync**
- 🔒 **HTTPS & TLS** via Let's Encrypt & Cert Manager
- 🎨 Beautiful **Next.js** + Tailwind frontend

---

## ⚙️ How It Works

```mermaid
graph TB
    User[👤 User] --> Web[🌐 Web Frontend<br/>React/Next.js Application]
    Web --> Core[🔧 Core Backend<br/>• User Auth<br/>• Repl Mgmt<br/>• S3 Integration<br/>• K8s Orchestration]
    Core --> S3[(🗄️ S3 Storage<br/>username/repl-id/<br/>├── templates/<br/>└── user-files/)]
    Core --> Orchestrator[🤖 AI Agent Orchestrator<br/>• LLM calls Gemini/Qwen<br/>• Agent planning & state<br/>• Execution scheduling]
    Orchestrator --> LLMAPI[🌐 External LLM Provider<br/>Gemini / Qwen / Custom API]
    subgraph K8sCluster["☸️ Kubernetes Cluster"]
        direction TB
        IngressController[🚪 Ingress NGINX Controller<br/>Traffic Routing]
        CertManager[🔒 Cert Manager<br/>TLS Certificate Management]
        subgraph ReplResources["📦 Per-Repl Resources"]
            Deployment[🚀 Deployment<br/>Repl Container Instance]
            Service[🔗 Service<br/>Internal Network Access]
            Ingress[🌍 Ingress<br/>External Access Route]
        end
        subgraph Pod["🏠 Repl Pod"]
            MainContainer[🐳 Runner Container<br/>• WebSocket Server<br/>• File Ops<br/>• PTY/Terminal<br/>• Code Execution]
            MCPServer[🧩 MCP Server - one-per-runner-session<br/>• Exec API - gRPC/WebSocket<br/>• Package/Network Proxy]
            EphemeralContainer[⚡ Ephemeral Container<br/>File Sync Back to S3<br/>🔄 Cleanup]
        end
        Deployment --> Pod
        Service --> Pod
        Ingress --> Service
        IngressController --> Ingress
    end
    Core --> K8sCluster
    Core -.->|Create Resources<br/>Deploy → Service → Ingress| ReplResources
    Web -.->|🔌 WebSocket Connection<br/>• File Mgmt • Terminal • Collaboration| MainContainer
    Core -.->|📁 Copy Template<br/>to user directory| S3
    EphemeralContainer -.->|💾 Sync Files Back<br/>Before Cleanup| S3
    MainContainer -.->|📂 Load Files<br/>on Session Start| S3
    Orchestrator -->|gRPC / WebSocket<br/>schedule & control| MCPServer
    MCPServer -->|runtime logs / results| Orchestrator
    Orchestrator -.->|Service discovery / k8s service| Service
    noteForMapping[/"Mapping: 1 runner session (Repl Pod) → 1 MCP Server (inside same pod)"/]
    noteForMapping -.-> MCPServer
````

---

### 🌀 Session Lifecycle

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web Frontend
    participant C as Core Service
    participant K as Kubernetes
    participant S as S3 Storage
    participant R as Runner Container

    U->>W: Create New Repl
    W->>C: POST /repl/create
    C->>S: Create user directory<br/>Copy template files

    U->>W: Start Session
    W->>C: POST /repl/start
    C->>K: Create Deployment<br/>Service & Ingress
    K->>R: Initialize Container
    R->>S: Download files
    R->>W: WebSocket Connection

    Note over U,R: Development Session Active
    U->>R: File operations via WebSocket
    R->>R: Real-time file editing

    U->>W: Close Session
    W->>C: POST /repl/stop
    C->>K: Inject Ephemeral Container
    K->>S: Upload modified files
    C->>K: Delete Resources
```

---

## 🔩 Key Components

### [`web/`](./web) – **Frontend**

* Built with **Next.js** + **Tailwind CSS**
* GitHub OAuth login
* GUI for File Tree, Editor, Terminal
* WebSocket hooks to interact with Runner

### [`core/`](./core) – **Backend API**

* Written in **Go**
* Handles user auth, S3 ops, Kubernetes deployments, cleanup
* Redis for REPL session state
* 📄 See [core/README.md](./core) for detailed architecture & deployment steps

### [`runner/`](./runner) – **REPL Runtime Container**

* Lightweight Go server
* WebSocket API for:

  * File tree and file content access
  * Terminal (PTY) sessions
* 📄 See [runner/README.md](./runner) for event list and package internals

### [`k8s/`](./k8s) – **Kubernetes Bootstrap & TLS**

* Contains:

  * Ingress-NGINX setup
  * `cert-manager` + Let’s Encrypt for auto TLS
* 📄 See [k8s/README.md](./k8s) for full setup instructions

### [`templates/`](./templates)

* Base folders (e.g. Node.js, Python) copied on REPL creation
* Language-specific dockerized scaffolds
* 📦 Want to add your own template? See the [Contribution Guide](./CONTRIBUTING.md)

---

## 🧱 Infrastructure

* ☸️ Kubernetes cluster for REPL pods
* 🔒 Cert Manager + Let’s Encrypt for TLS
* 🗃️ S3-compatible storage for persistence
* 🐳 Docker images for runtime environments
* ⚙️ Redis for in-memory session tracking

---

## 📦 Deployment Flow

1. User logs in and creates a REPL
2. `core/` copies a template into `username/repl-id/` on S3
3. `core/` deploys a pod, service, ingress in Kubernetes
4. `runner/` connects via WebSocket and serves FS + Terminal
5. On session end:

   * Ephemeral container uploads updated files to S3
   * All K8s resources are cleaned up

---

## 💻 Tech Stack

| Layer         | Stack                              |
| ------------- | ---------------------------------- |
| Frontend      | Next.js, Tailwind, WebSockets      |
| Backend       | GoLang (Echo/Fiber), Redis, S3 SDK |
| Runner        | GoLang + PTY + WebSocket           |
| Orchestration | Kubernetes, Docker, Docker Swarm   |
| Networking    | Ingress NGINX + cert-manager       |
| Auth          | GitHub OAuth                       |

---

## 📄 Per-Component Docs

📚 For deeper implementation details:

* [`core/`](./core) – [Backend README.md](./core/README.md)
* [`runner/`](./runner) – [Runner WebSocket README.md](./runner/README.md)
* [`k8s/`](./k8s) – [Kubernetes + TLS Setup](./k8s/README.md)
* [`web/`](./web) – [Frontend README.md](./web/README.md)

---

## 🧠 Why I Built This

> “This project is my deep dive into Cloud Infrastructure, DevOps, and FullStack Engineering — wrapped in a real-world application.”
> — [Parth Kapoor](https://parthkapoor.me)

---

## 🌐 Demo & Links

* 🧪 [Live](https://devx.parthkapoor.me)
* 🧑‍💻 [Portfolio](https://parthkapoor.me)
* 🐙 [GitHub Repo](https://github.com/ParthKapoor-dev/devex)

---

## 🤝 Contributing

This project is under active development.
Want to contribute a template, fix, or feature? Start here 👉 [CONTRIBUTING.md](./CONTRIBUTING.md)

Pull requests, suggestions, and feedback are always welcome!

---

## 📜 License

Licensed under the [MIT License](./LICENSE)
