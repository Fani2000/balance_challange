using BankingApp.ApiService.Models;

namespace BankingApp.ApiService.Services;

public interface IAccountService
{
    Task<AccountDto?> GetAccountAsync(int accountId);
    Task<AccountSummaryDto> GetAccountSummaryAsync(int accountId);
    Task<bool> TransferMoneyAsync(int fromAccountId, string toUsername, decimal amount);
    Task<bool> RequestLoanAsync(int accountId, decimal amount);
    Task<bool> CloseAccountAsync(int accountId, string username, string pin);
    
    Task<bool> DepositAsync(int accountId, decimal amount, string paymentMethod);
    
    Task<bool> WithdrawAsync(int accountId, decimal amount, string withdrawalMethod);
}