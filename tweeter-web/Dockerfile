# Multi-stage build for Tweeter web frontend
# Build stage: compile shared package and Vite app
FROM node:20-alpine AS build

WORKDIR /usr/src/app

# Install root and workspace dependencies first (for better Docker caching)
COPY package.json package-lock.json ./
COPY tweeter-web/package.json tweeter-web/package.json
COPY tweeter-shared/package.json tweeter-shared/package.json

RUN npm ci

# Copy the full workspace source
COPY . .

# Optionally allow overriding the API base URL at build time.
# Vite will pick up any environment variable starting with VITE_.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build shared library and web app
RUN npm --workspace tweeter-shared run compile \
    && npm --workspace tweeter-web run build

# Runtime stage: serve static assets with nginx
FROM nginx:1.27-alpine AS runtime

# Remove default configuration and use our SPA-friendly config
RUN rm /etc/nginx/conf.d/default.conf
COPY tweeter-web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /usr/src/app/tweeter-web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
