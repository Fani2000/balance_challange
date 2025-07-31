#!/bin/sh

# Process the config.js file with environment variables
envsubst < /usr/share/nginx/html/config.js.template > /usr/share/nginx/html/config.js

# Process the nginx configuration template
envsubst '${VITE_API_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Check if the API endpoint is set and valid
if [ -z "$VITE_API_URL" ] || [ "$VITE_API_URL" = "http://localhost:5000" ]; then
  echo "Warning: VITE_API_URL is not set or is using the example value. API proxy will not work correctly."
  # Remove the API proxy configuration to avoid nginx startup errors
  sed -i '/location \/api\//,/}/d' /etc/nginx/conf.d/default.conf
fi

# Start nginx
exec nginx -g 'daemon off;'