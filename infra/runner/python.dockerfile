# The runner binary comes from the runner-service image built from the SAME
# commit. The runner pipeline builds and pushes runner-service:<sha> first and
# then passes that sha here as RUNNER_IMAGE_TAG. A plain local `docker build`
# falls back to :latest.
ARG RUNNER_IMAGE_TAG=latest
FROM ghcr.io/parthkapoor-dev/devex/runner-service:${RUNNER_IMAGE_TAG} AS runner

FROM python:3.11-slim

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
    git \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Python specific tools
RUN pip install --no-cache-dir \
    flask \
    fastapi \
    uvicorn \
    requests \
    ipython

# ✅  Install Starship prompt
RUN curl -sS https://starship.rs/install.sh | sh -s -- -y && \
    echo 'eval "$(starship init bash)"' >> /root/.bashrc

# Copy the compiled Go binary from the runner stage above.
COPY --from=runner /app/main /app/runner

# ✅ Set permissions if needed (e.g., make executable)
RUN chmod +x /app/runner

# ✅ Port on which your Go backend or other service runs
EXPOSE 8080

# ✅ Default command: run the Go binary as the container entrypoint
CMD ["/app/runner"]
