# syntax=docker/dockerfile:1

# --- Builder stage: compile the static site with Hugo (extended) ---
FROM hugomods/hugo:0.164.0 AS builder

WORKDIR /src

COPY . .

RUN hugo --minify --gc

# --- Post-process stage: Python runtime for Cloudinary rewrite + root redirects ---
FROM python:3.12-alpine AS postprocess

WORKDIR /src

COPY --from=builder /src/public /src/public
COPY content/ /src/content/
COPY scripts/ /src/scripts/

# Conditional Cloudinary rewrite: when CLOUD_NAME is non-empty, swap local
# /images/ references for Cloudinary delivery URLs. Then generate root-level
# redirect stubs for old root URLs of IT/FR posts.
ARG CLOUD_NAME=""
ARG CLOUD_FOLDER="blog"
RUN if [ -n "${CLOUD_NAME}" ]; then \
      CLOUDINARY_CLOUD_NAME="${CLOUD_NAME}" CLOUDINARY_FOLDER="${CLOUD_FOLDER}" \
      python3 scripts/cloudinary_sync.py --rewrite-only; \
    fi \
    && python3 scripts/generate_redirects.py

# --- Serve stage: nginx serves the generated public/ directory ---
FROM nginx:1.27-alpine AS server

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=postprocess /src/public /usr/share/nginx/html

EXPOSE 80

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]