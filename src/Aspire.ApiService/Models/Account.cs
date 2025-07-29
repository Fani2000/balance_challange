namespace BankingApp.ApiService.Models;

public class Account
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public string Pin { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; } = true;
    
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}