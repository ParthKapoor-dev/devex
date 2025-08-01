PROTO_DIR := packages/proto
PROTO_SRC := $(wildcard $(PROTO_DIR)/*.proto)
GO_OUT := ./packages

.PHONY: generate-proto
generate-proto:
	protoc \
		--proto_path=$(PROTO_DIR) \
		--go_out=$(GO_OUT) \
		--go-grpc_out=$(GO_OUT) \
		$(PROTO_SRC)
