using BankingApp.ApiService.Models;
using Microsoft.EntityFrameworkCore;

namespace BankingApp.ApiService;

public static class SeedData
{
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
        await using var scope = serviceProvider.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<BankingContext>();

        await context.Database.MigrateAsync();

         var account = new Account
            {
                Username = "Fani",
                FirstName = "Fani",
                LastName = "Keorapetse",
                Balance = 33952.59m,
                Pin = "1111",
                CreatedAt = DateTime.UtcNow, // Use UTC
                IsActive = true
            };

            context.Accounts.Add(account);
            await context.SaveChangesAsync();

            // Add sample transactions with UTC dates
            var utcNow = DateTime.UtcNow;
            var utcToday = DateTime.UtcNow.Date;
            
            var transactions = new[]
            {
                new Transaction { 
                    AccountId = 1, 
                    Type = TransactionType.DEPOSIT, 
                    Amount = 1000.00m, 
                    Description = "Salary Payment", 
                    CreatedAt = utcToday 
                },
                new Transaction { 
                    AccountId = 1, 
                    Type = TransactionType.WITHDRAWAL, 
                    Amount = -2400.00m, 
                    Description = "ATM Withdrawal", 
                    CreatedAt = utcToday.AddHours(-2) 
                },
                new Transaction { 
                    AccountId = 1, 
                    Type = TransactionType.DEPOSIT, 
                    Amount = 2000.00m, 
                    Description = "Transfer In", 
                    CreatedAt = utcToday.AddHours(-4) 
                },
                new Transaction { 
                    AccountId = 1, 
                    Type = TransactionType.DEPOSIT, 
                    Amount = 10000.00m, 
                    Description = "Investment Return", 
                    CreatedAt = utcToday.AddHours(-6) 
                },
                new Transaction { 
                    AccountId = 1, 
                    Type = TransactionType.WITHDRAWAL, 
                    Amount = -2500.00m, 
                    Description = "Online Purchase", 
                    CreatedAt = utcToday.AddHours(-8) 
                },
                new Transaction { 
                    AccountId = 1, 
                    Type = TransactionType.DEPOSIT, 
                    Amount = 1300.00m, 
                    Description = "Bonus Payment", 
                    CreatedAt = new DateTime(2020, 3, 12, 0, 0, 0, DateTimeKind.Utc) 
                },
                new Transaction { 
                    AccountId = 1, 
                    Type = TransactionType.DEPOSIT, 
                    Amount = 79.97m, 
                    Description = "Freelance Work", 
                    CreatedAt = new DateTime(2020, 3, 8, 0, 0, 0, DateTimeKind.Utc) 
                },
                new Transaction { 
                    AccountId = 1, 
                    Type = TransactionType.INTEREST, 
                    Amount = 479.46m, 
                    Description = "Monthly Interest", 
                    CreatedAt = utcNow.AddDays(-5) 
                }
            };

            context.Transactions.AddRange(transactions);
            await context.SaveChangesAsync();

            // Add another account for testing transfers
            context.Accounts.Add(new Account
            {
                Username = "testuser",
                FirstName = "Test",
                LastName = "User",
                Balance = 1000.00m,
                Pin = "2222",
                CreatedAt = DateTime.UtcNow, // Use UTC
                IsActive = true
            });

            await context.SaveChangesAsync();
    }
}