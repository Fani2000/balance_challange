using BankingApp.ApiService.Services;
using Microsoft.AspNetCore.Mvc;

namespace BankingApp.ApiService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;
    private const int DefaultAccountId = 1; // For demo purposes

    public TransactionsController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpGet]
    public async Task<ActionResult> GetTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var transactions = await _transactionService.GetTransactionsAsync(DefaultAccountId, page, pageSize);
        return Ok(transactions);
    }
}