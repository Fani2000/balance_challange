var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("postgres")
    .WithEnvironment("POSTGRES_DB", "BankingDb")
    .WithLifetime(ContainerLifetime.Persistent);

var bankingDb = postgres.AddDatabase("bankingdb");

var cache = builder.AddRedis("cache");

var apiService = builder.AddProject<Projects.Aspire_ApiService>("apiservice")
    .WithReference(cache)
    .WithReference(bankingDb)
    .WithExternalHttpEndpoints()
    .WaitFor(cache)
    .WaitFor(bankingDb);

var webApp = builder.AddNpmApp("webfrontend", "../frontend", "dev")
    .WaitFor(apiService)
    .WithReference(apiService)
    .WithEndpoint(3000, 3000, "http", null, null, false, true)
    .WithExternalHttpEndpoints();

builder.Build().Run();
