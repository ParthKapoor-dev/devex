# ---- Step 1: Build Stage ----
# Use official Go image to build the binary
FROM golang:1.24 AS builder

# Set working directory
WORKDIR /app

# ✅ Copy go.mod and go.sum first for better caching of dependencies
COPY go.mod go.sum ./
RUN go mod tidy

# ✅ Copy the rest of the application source code
COPY . .

# ✅ Build the Go binary (static binary)
RUN CGO_ENABLED=0 GOOS=linux go build -o runner ./cmd/main.go


# ---- Step 2: Final Runtime Stage ----
# ✅ Use a minimal Node.js image with Debian Slim as the base
FROM node:20-slim

# Set working directory
WORKDIR /app

# ✅ Install essential packages:
# - bash: for interactive shell
# - curl: for downloading (e.g., starship)
# - ca-certificates: for HTTPS support
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    bash \
    curl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js specific tools
RUN npm install -g nodemon typescript ts-node

# ✅  Install Starship prompt
RUN curl -sS https://starship.rs/install.sh | sh -s -- -y && \
    echo 'eval "$(starship init bash)"' >> /root/.bashrc


# ✅ Copy the compiled Go binary from builder
COPY --from=builder /app/runner .

# ✅ Set permissions if needed (e.g., make executable)
# RUN chmod +x /app/runner

# ✅ Port on which your Go backend or other service runs
EXPOSE 8080

# ✅ Default command: run the Go binary as the container entrypoint
CMD ["/app/runner"]
