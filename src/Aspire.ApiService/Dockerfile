FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
# Remove explicit EXPOSE statements - Azure will handle port mapping
# EXPOSE 8080
# EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy the project file first
COPY ["Aspire.ApiService.csproj", "./"]
RUN dotnet restore "Aspire.ApiService.csproj"

# Copy the rest of the source code
COPY . .

# Build the application
RUN dotnet build "Aspire.ApiService.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Aspire.ApiService.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Use environment variable for port (Azure App Service sets this automatically)
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "Aspire.ApiService.dll"]