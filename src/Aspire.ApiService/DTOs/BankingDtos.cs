namespace BankingApp.ApiService.Models;

public record AccountDto(
    int Id,
    string Username,
    string FirstName,
    string LastName,
    decimal Balance,
    DateTime CreatedAt
);

public record TransactionDto(
    int Id,
    string Type,
    decimal Amount,
    string Description,
    string? Recipient,
    DateTime CreatedAt
);

public record TransferRequest(string Recipient, decimal Amount);
public record LoanRequest(decimal Amount);
public record CloseAccountRequest(string Username, string Pin);

public record AccountSummaryDto(
    decimal TotalIn,
    decimal TotalOut,
    decimal Interest
);

public record DepositRequest(
    decimal Amount,
    string PaymentMethod
);

public record WithdrawRequest(
    decimal Amount,
    string WithdrawalMethod
);