using BankingApp.ApiService.Models;

namespace BankingApp.ApiService.Services;

public interface ITransactionService
{
    Task<IEnumerable<TransactionDto>> GetTransactionsAsync(int accountId, int page = 1, int pageSize = 20);
}