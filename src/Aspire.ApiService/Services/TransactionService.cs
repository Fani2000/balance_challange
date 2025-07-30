using BankingApp.ApiService.Models;
using Microsoft.EntityFrameworkCore;

namespace BankingApp.ApiService.Services;

public class TransactionService : ITransactionService
{
    private readonly BankingContext _context;

    public TransactionService(BankingContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TransactionDto>> GetTransactionsAsync(int accountId, int page = 1, int pageSize = 6)
    {
        var transactions = await _context.Transactions
            .Where(t => t.AccountId == accountId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return transactions.Select(t => new TransactionDto(
            t.Id,
            t.Type.ToString(),
            t.Amount,
            t.Description,
            t.Recipient,
            t.CreatedAt
        ));
    }
}