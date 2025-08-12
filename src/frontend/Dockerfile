# Build stage: For building the Vue frontend
FROM node:20-alpine AS build
WORKDIR /app

# Set build arguments for environment variables
ARG BACKEND_URL=""
ARG NODE_ENV=production

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source files
COPY . .

# Create .env file with build arguments (for Vite)
RUN echo "VITE_BACKEND_URL=${BACKEND_URL}" > .env.production

# Build the application
RUN npm run build

# Verify build output
RUN ls -la /app/dist/

# Production stage: Using Nginx to serve the application
FROM nginx:alpine

# Install required packages
RUN apk add --no-cache gettext curl

# Remove default nginx configuration
RUN rm -rf /etc/nginx/conf.d/default.conf /usr/share/nginx/html/*

# Copy built files to Nginx root directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Create default nginx config (fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set default environment variables for runtime
ENV BACKEND_URL=""
ENV NODE_ENV=production

# Copy entrypoint script and ensure it has correct format
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && \
    # Fix potential line ending issues
    sed -i 's/\r$//' /docker-entrypoint.sh

# Create necessary directories
RUN mkdir -p /var/cache/nginx /var/run/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

# Expose port
EXPOSE 80

# Use the entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]