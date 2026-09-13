# DevEx monorepo tasks. Run `make help` for the list.
#
# The Go code is four modules tied together by go.work: packages (shared
# code), apps/core, apps/runner and apps/mcp. Every Go target below runs
# inside each module with GOWORK=off, because that is how a Docker build or a
# fresh CI checkout sees a module: a dependency that only resolves through the
# workspace fails here instead of in an image build.

GO_MODULES := packages apps/core apps/runner apps/mcp

PROTO_DIR := packages/proto
PROTO_SRC := $(wildcard $(PROTO_DIR)/*.proto)
GO_OUT    := ./packages

# Pinned so everyone, CI and the Dockerfiles generate identical code.
# Bump these deliberately, in one commit, together with the Dockerfiles.
PROTOC_GEN_GO_VERSION      := v1.36.6
PROTOC_GEN_GO_GRPC_VERSION := v1.5.1

.DEFAULT_GOAL := help

.PHONY: help
help: ## List the available targets
	@grep -hE '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ---- Protobuf ---------------------------------------------------------------

.PHONY: proto-tools
proto-tools: ## Install the pinned protoc plugins (protoc itself comes from your OS)
	go install google.golang.org/protobuf/cmd/protoc-gen-go@$(PROTOC_GEN_GO_VERSION)
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@$(PROTOC_GEN_GO_GRPC_VERSION)

.PHONY: proto generate-proto
proto: generate-proto ## Generate Go code from packages/proto into packages/pb
generate-proto:
	protoc \
		--proto_path=$(PROTO_DIR) \
		--go_out=$(GO_OUT) \
		--go-grpc_out=$(GO_OUT) \
		$(PROTO_SRC)

# ---- Go ---------------------------------------------------------------------

.PHONY: build
build: ## Compile every Go module
	@set -e; for m in $(GO_MODULES); do echo "==> build $$m"; (cd $$m && GOWORK=off go build ./...); done

.PHONY: vet
vet: ## Run go vet on every Go module
	@set -e; for m in $(GO_MODULES); do echo "==> vet $$m"; (cd $$m && GOWORK=off go vet ./...); done

.PHONY: test
test: ## Run the Go unit tests
	@set -e; for m in $(GO_MODULES); do echo "==> test $$m"; (cd $$m && GOWORK=off go test ./...); done

.PHONY: test-race
test-race: ## Run the Go unit tests with the race detector (needs cgo)
	@set -e; for m in $(GO_MODULES); do echo "==> test -race $$m"; (cd $$m && GOWORK=off go test -race ./...); done

.PHONY: tidy-check
tidy-check: ## Fail if any go.mod or go.sum is not tidy
	@set -e; for m in $(GO_MODULES); do echo "==> tidy $$m"; (cd $$m && GOWORK=off go mod tidy -diff); done

# ---- Web --------------------------------------------------------------------

.PHONY: web-check
web-check: ## Lint and type-check the web app (does not build it)
	cd apps/web && npm run lint && npx tsc --noEmit

# ---- Local development ------------------------------------------------------

.PHONY: dev-core
dev-core: ## Run the core API with live reload (needs `air` and apps/core/.env)
	cd apps/core && air

.PHONY: dev-web
dev-web: ## Run the web app dev server
	cd apps/web && npm run dev

# ---- Everything CI runs -----------------------------------------------------

.PHONY: ci
ci: proto tidy-check build vet test web-check ## Run the same checks as CI, locally
