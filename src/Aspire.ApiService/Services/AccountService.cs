using BankingApp.ApiService.Models;
using Microsoft.EntityFrameworkCore;

namespace BankingApp.ApiService.Services;

public class AccountService : IAccountService
{
    private readonly BankingContext _context;

    public AccountService(BankingContext context)
    {
        _context = context;
    }

    public async Task<AccountDto?> GetAccountAsync(int accountId)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.IsActive);

        if (account == null) return null;

        return new AccountDto(
            account.Id,
            account.Username,
            account.FirstName,
            account.LastName,
            account.Balance,
            account.CreatedAt
        );
    }

    public async Task<AccountSummaryDto> GetAccountSummaryAsync(int accountId)
    {
        var transactions = await _context.Transactions
            .Where(t => t.AccountId == accountId)
            .ToListAsync();

        var totalIn = transactions
            .Where(t => t.Type == TransactionType.DEPOSIT || 
                       t.Type == TransactionType.TRANSFER_IN || 
                       t.Type == TransactionType.LOAN ||
                       t.Type == TransactionType.INTEREST)
            .Sum(t => t.Amount);

        var totalOut = transactions
            .Where(t => t.Type == TransactionType.WITHDRAWAL || 
                       t.Type == TransactionType.TRANSFER_OUT)
            .Sum(t => Math.Abs(t.Amount));

        var interest = transactions
            .Where(t => t.Type == TransactionType.INTEREST)
            .Sum(t => t.Amount);

        return new AccountSummaryDto(totalIn, totalOut, interest);
    }

    public async Task<bool> TransferMoneyAsync(int fromAccountId, string toUsername, decimal amount)
    {
        if (amount <= 0) return false;

        var fromAccount = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == fromAccountId && a.IsActive);

        var toAccount = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Username == toUsername && a.IsActive);

        if (fromAccount == null || toAccount == null || fromAccount.Balance < amount)
            return false;

        // Deduct from sender
        fromAccount.Balance -= amount;
        _context.Transactions.Add(new Transaction
        {
            AccountId = fromAccountId,
            Type = TransactionType.TRANSFER_OUT,
            Amount = -amount,
            Description = $"Transfer to {toUsername}",
            Recipient = toUsername,
            CreatedAt = DateTime.UtcNow
        });

        // Add to recipient
        toAccount.Balance += amount;
        _context.Transactions.Add(new Transaction
        {
            AccountId = toAccount.Id,
            Type = TransactionType.TRANSFER_IN,
            Amount = amount,
            Description = $"Transfer from {fromAccount.Username}",
            Recipient = fromAccount.Username,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RequestLoanAsync(int accountId, decimal amount)
    {
        if (amount <= 0) return false;

        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.IsActive);

        if (account == null) return false;

        // Simple loan approval logic - approve if amount is less than 10% of current balance
        if (amount > account.Balance * 0.1m) return false;

        account.Balance += amount;
        _context.Transactions.Add(new Transaction
        {
            AccountId = accountId,
            Type = TransactionType.LOAN,
            Amount = amount,
            Description = "Loan approved",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }
    
    public async Task<bool> DepositAsync(int accountId, decimal amount, string paymentMethod)
    {
        if (amount <= 0) return false;

        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.IsActive);

        if (account == null) return false;

        // Add to account balance
        account.Balance += amount;
    
        // Create transaction record
        _context.Transactions.Add(new Transaction
        {
            AccountId = accountId,
            Type = TransactionType.DEPOSIT,
            Amount = amount,
            Description = $"Deposit via {paymentMethod}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> WithdrawAsync(int accountId, decimal amount, string withdrawalMethod)
    {
        if (amount <= 0) return false;

        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.IsActive);

        if (account == null || account.Balance < amount) return false;

        // Deduct from account balance
        account.Balance -= amount;

        // Create transaction record
        _context.Transactions.Add(new Transaction
        {
            AccountId = accountId,
            Type = TransactionType.WITHDRAWAL,
            Amount = -amount, // Negative amount for withdrawals
            Description = $"Withdrawal to {withdrawalMethod}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CloseAccountAsync(int accountId, string username, string pin)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.IsActive);

        if (account == null || account.Username != username || account.Pin != pin)
            return false;

        account.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }
    
}
