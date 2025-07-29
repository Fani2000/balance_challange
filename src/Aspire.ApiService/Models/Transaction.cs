﻿namespace BankingApp.ApiService.Models;

public class Transaction
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public TransactionType Type { get; set; }
    public decimal Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Recipient { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public Account Account { get; set; } = null!;
}

public enum TransactionType
{
    DEPOSIT,
    WITHDRAWAL,
    TRANSFER_IN,
    TRANSFER_OUT,
    LOAN,
    INTEREST
}