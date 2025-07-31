# Simplified version without nginx template
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html

# Simple entrypoint without complex templates
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo 'echo "🚀 Starting Banking App..."' >> /docker-entrypoint.sh && \
    echo 'export VITE_API_URL="${VITE_API_URL:-http://localhost:8080}"' >> /docker-entrypoint.sh && \
    echo 'cat > /usr/share/nginx/html/config.js << "JSEOF"' >> /docker-entrypoint.sh && \
    echo 'window.ENV = {' >> /docker-entrypoint.sh && \
    echo '  VITE_API_URL: "'"'"'${VITE_API_URL}'"'"'",' >> /docker-entrypoint.sh && \
    echo '  NODE_ENV: "'"'"'${NODE_ENV:-production}'"'"'"' >> /docker-entrypoint.sh && \
    echo '};' >> /docker-entrypoint.sh && \
    echo 'JSEOF' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]