using BankingApp.ApiService;
using BankingApp.ApiService.Models;
using BankingApp.ApiService.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults & Aspire client integrations.
// builder.AddServiceDefaults();

// Add services to the container.
// builder.Services.AddProblemDetails();

// Add Entity Framework
builder.Services.AddDbContext<BankingContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("bankingdb")));


// Add Redis for distributed caching
/*
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("cache");
    options.InstanceName = "bankingCache:";
});
*/

// Add repositories and services
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();


// Add controllers
builder.Services.AddControllers();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});


// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var port = Environment.GetEnvironmentVariable("PORT");

builder.WebHost.UseUrls($"http://+:{port}");

var app = builder.Build();

// Configure the HTTP request pipeline.
// app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAllOrigins");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// Seed data
using (var scope = app.Services.CreateScope())
{
    await SeedData.Initialize(scope.ServiceProvider);
}

app.Run();