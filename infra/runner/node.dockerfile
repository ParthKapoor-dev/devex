# The runner binary comes from the runner-service image built from the SAME
# commit. The runner pipeline builds and pushes runner-service:<sha> first and
# then passes that sha here as RUNNER_IMAGE_TAG. A plain local `docker build`
# falls back to :latest.
ARG RUNNER_IMAGE_TAG=latest
FROM ghcr.io/parthkapoor-dev/devex/runner-service:${RUNNER_IMAGE_TAG} AS runner

# Base Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install essential packages:
# - bash: for interactive shell
# - curl: for downloading (e.g., starship)
# - ca-certificates: for HTTPS support
# - git: often useful in dev/test environments for cloning repos or tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    bash \
    curl \
    ca-certificates \
    git && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js specific tools
RUN npm install -g nodemon typescript ts-node

# Install Starship prompt
# Ensure the shell is configured for starship
RUN curl -sS https://starship.rs/install.sh | sh -s -- -y && \
    echo 'eval "$(starship init bash)"' >> /root/.bashrc

# Copy the compiled Go binary from the runner stage above.
COPY --from=runner /app/main /app/runner

# Set permissions for the copied binary
RUN chmod +x /app/runner

# Expose port (if your Node.js app interacts with the Go backend, or the Go backend is exposed)
EXPOSE 8080

# Default command: You can choose to run the Go binary, or have a script that starts both.
CMD ["/app/runner"]
