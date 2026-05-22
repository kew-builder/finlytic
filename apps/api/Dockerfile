# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Finlytic.sln .
COPY src/Finlytic.Api/Finlytic.Api.csproj src/Finlytic.Api/
COPY src/Finlytic.Application/Finlytic.Application.csproj src/Finlytic.Application/
COPY src/Finlytic.Domain/Finlytic.Domain.csproj src/Finlytic.Domain/
COPY src/Finlytic.Infrastructure/Finlytic.Infrastructure.csproj src/Finlytic.Infrastructure/
RUN dotnet restore src/Finlytic.Api/Finlytic.Api.csproj

COPY src/ src/
RUN dotnet publish src/Finlytic.Api/Finlytic.Api.csproj -c Release -o /publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

COPY --from=build /publish .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Finlytic.Api.dll"]
