#!/bin/bash
# Complete Azure Deployment Script for Banking App
# This script deploys the entire Docker Compose application to Azure Web Apps

set -e

# ========================================
# CONFIGURATION
# ========================================

RESOURCE_GROUP="bankingapp-rg"
LOCATION="East US"
REGISTRY_NAME="fanirg"
POSTGRES_SERVER="bankingapp-postgres"
POSTGRES_DB="bankingapp"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="BankingSecure123!"
REDIS_CACHE_NAME="bankingapp-redis"
FRONTEND_APP="bankingapp-frontend"
BACKEND_APP="bankingapp-backend"
APP_SERVICE_PLAN="bankingapp-plan"

echo "🚀 Starting complete Azure deployment for Banking App..."

# ========================================
# STEP 1: INFRASTRUCTURE SETUP
# ========================================

echo "🏗️ STEP 1: Setting up Azure infrastructure..."

# Check Azure CLI login
if ! az account show &> /dev/null; then
    echo "❌ Please log in to Azure CLI first: az login"
    exit 1
fi

# Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create container registry
echo "🐳 Creating Azure Container Registry..."
az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $REGISTRY_NAME \
    --sku Standard \
    --admin-enabled true

# Get registry credentials
REGISTRY_SERVER="${REGISTRY_NAME}.azurecr.io"
REGISTRY_USERNAME=$(az acr credential show --name $REGISTRY_NAME --query "username" -o tsv)
REGISTRY_PASSWORD=$(az acr credential show --name $REGISTRY_NAME --query "passwords[0].value" -o tsv)

# Create PostgreSQL Flexible Server
echo "🐘 Creating PostgreSQL Flexible Server..."
az postgres flexible-server create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER \
    --location "$LOCATION" \
    --admin-user $POSTGRES_USER \
    --admin-password "$POSTGRES_PASSWORD" \
    --sku-name Standard_B2s \
    --tier Burstable \
    --storage-size 128 \
    --version 17 \
    --public-access All

# Create database
echo "💾 Creating database..."
az postgres flexible-server db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $POSTGRES_SERVER \
    --database-name $POSTGRES_DB

# Create App Service Plan
echo "📋 Creating App Service Plan..."
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku P1V3 \
    --is-linux

# ========================================
# STEP 2: CONNECTION STRINGS
# ========================================

echo "🔗 STEP 2: Generating connection strings..."

# PostgreSQL connection string
POSTGRES_CONNECTION="Host=${POSTGRES_SERVER}.postgres.database.azure.com;Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD};SSL Mode=Require;Trust Server Certificate=true"

# ========================================
# STEP 3: BUILD AND PUSH IMAGES
# ========================================

echo "🏗️ STEP 3: Building and pushing Docker images..."

# Login to ACR
az acr login --name $REGISTRY_NAME

# Build and push backend image
echo "📦 Building backend image..."
docker build -f ./src/Aspire.ApiService/Dockerfile -t $REGISTRY_SERVER/$BACKEND_APP:latest .
docker push $REGISTRY_SERVER/$BACKEND_APP:latest

# Build and push frontend image
echo "📦 Building frontend image..."
cd src/frontend
docker build --build-arg VITE_API_URL=https://$BACKEND_APP.azurewebsites.net -t $REGISTRY_SERVER/$FRONTEND_APP:latest .
docker push $REGISTRY_SERVER/$FRONTEND_APP:latest
cd ../..

# ========================================
# STEP 4: CREATE WEB APPS
# ========================================

echo "🖥️ STEP 4: Creating web applications..."

# Create backend web app
echo "🖥️ Creating backend web app..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $BACKEND_APP \
    --deployment-container-image-name $REGISTRY_SERVER/$BACKEND_APP:latest

# Create frontend web app
echo "🌐 Creating frontend web app..."
az webapp create \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --name $FRONTEND_APP \
    --deployment-container-image-name $REGISTRY_SERVER/$FRONTEND_APP:latest

# ========================================
# STEP 5: CONFIGURE BACKEND
# ========================================

echo "⚙️ STEP 5: Configuring backend environment..."

# Configure backend app settings
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP \
    --settings \
        "ConnectionStrings__bankingdb=$POSTGRES_CONNECTION" \
        "ConnectionStrings__cache=$REDIS_CONNECTION" \
        ASPNETCORE_ENVIRONMENT=Production \
        ASPNETCORE_URLS=http://+:8080 \
        FRONTEND_URL="https://${FRONTEND_APP}.azurewebsites.net" \
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false \
        WEBSITES_PORT=8080 \
        WEBSITES_CONTAINER_START_TIME_LIMIT=1800 \
        DOCKER_REGISTRY_SERVER_URL="https://${REGISTRY_SERVER}" \
        DOCKER_REGISTRY_SERVER_USERNAME="$REGISTRY_USERNAME" \
        DOCKER_REGISTRY_SERVER_PASSWORD="$REGISTRY_PASSWORD"

# ========================================
# STEP 6: CONFIGURE FRONTEND
# ========================================

echo "⚙️ STEP 6: Configuring frontend environment..."

# Configure frontend app settings
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $FRONTEND_APP \
    --settings \
        VITE_API_URL="https://${BACKEND_APP}.azurewebsites.net" \
        NODE_ENV=production \
        Name=Fani \
        APP_VERSION=1.0.0 \
        BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false \
        WEBSITES_PORT=80 \
        DOCKER_REGISTRY_SERVER_URL="https://${REGISTRY_SERVER}" \
        DOCKER_REGISTRY_SERVER_USERNAME="$REGISTRY_USERNAME" \
        DOCKER_REGISTRY_SERVER_PASSWORD="$REGISTRY_PASSWORD"

# ========================================
# STEP 7: ADDITIONAL CONFIGURATION
# ========================================

echo "🔧 STEP 7: Additional configuration..."

# Configure CORS
az webapp cors add \
    --resource-group $RESOURCE_GROUP \
    --name $BACKEND_APP \
    --allowed-origins "https://${FRONTEND_APP}.azurewebsites.net"

# Enable HTTPS only for frontend
az webapp update \
    --resource-group $RESOURCE_GROUP \
    --name $FRONTEND_APP \
    --https-only true

# Enable continuous deployment
az webapp deployment container config \
    --name $BACKEND_APP \
    --resource-group $RESOURCE_GROUP \
    --enable-cd true

az webapp deployment container config \
    --name $FRONTEND_APP \
    --resource-group $RESOURCE_GROUP \
    --enable-cd true

# ========================================
# DEPLOYMENT COMPLETE
# ========================================

echo ""
echo "✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo ""
echo "📊 Resource Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Container Registry: $REGISTRY_SERVER"
echo "  PostgreSQL Server: ${POSTGRES_SERVER}.postgres.database.azure.com"
echo "  Redis Cache: ${REDIS_CACHE_NAME}.redis.cache.windows.net"
echo "  App Service Plan: $APP_SERVICE_PLAN"
echo ""
echo "🌐 Application URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Frontend App: https://${FRONTEND_APP}.azurewebsites.net"
echo "  Backend API: https://${BACKEND_APP}.azurewebsites.net"
echo "  Backend Health: https://${BACKEND_APP}.azurewebsites.net/health"
echo "  Swagger UI: https://${BACKEND_APP}.azurewebsites.net/swagger"
echo "  Application Insights: $APPINSIGHTS_NAME"
echo ""
echo "🔐 Connection Strings:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PostgreSQL: $POSTGRES_CONNECTION"
echo "  Redis: $REDIS_CONNECTION"
echo ""
echo "⏳ Note: It may take 10-15 minutes for all services to fully start."
echo "🔍 Monitor the deployment progress in the Azure Portal."
echo "📊 Check Application Insights for monitoring and logging."
echo ""
echo "🎉 Your Banking App is now deployed to Azure!"