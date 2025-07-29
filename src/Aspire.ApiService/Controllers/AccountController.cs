using BankingApp.ApiService.Models;
using BankingApp.ApiService.Services;
using Microsoft.AspNetCore.Mvc;

namespace BankingApp.ApiService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;
    private const int DefaultAccountId = 1; // For demo purposes

    public AccountController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    [HttpGet]
    public async Task<ActionResult<AccountDto>> GetAccount()
    {
        var account = await _accountService.GetAccountAsync(DefaultAccountId);
        if (account == null)
            return NotFound();

        return Ok(account);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AccountSummaryDto>> GetAccountSummary()
    {
        var summary = await _accountService.GetAccountSummaryAsync(DefaultAccountId);
        return Ok(summary);
    }

    [HttpPost("transfer")]
    public async Task<ActionResult> TransferMoney([FromBody] TransferRequest request)
    {
        var success = await _accountService.TransferMoneyAsync(
            DefaultAccountId, 
            request.Recipient, 
            request.Amount);

        if (!success)
            return BadRequest("Transfer failed");

        return Ok(new { Message = "Transfer completed successfully" });
    }

    [HttpPost("loan")]
    public async Task<ActionResult> RequestLoan([FromBody] LoanRequest request)
    {
        var success = await _accountService.RequestLoanAsync(DefaultAccountId, request.Amount);

        if (!success)
            return BadRequest("Loan request denied");

        return Ok(new { Message = "Loan approved" });
    }

    [HttpPost("close")]
    public async Task<ActionResult> CloseAccount([FromBody] CloseAccountRequest request)
    {
        var success = await _accountService.CloseAccountAsync(
            DefaultAccountId, 
            request.Username, 
            request.Pin);

        if (!success)
            return BadRequest("Account closure failed");

        return Ok(new { Message = "Account closed successfully" });
    }
}