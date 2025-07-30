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
    
    // Add these endpoints to your AccountController.cs

[HttpPost("deposit")]
public async Task<ActionResult> Deposit([FromBody] DepositRequest request)
{
    if (request.Amount <= 0)
        return BadRequest("Deposit amount must be greater than 0");

    if (request.Amount < 10)
        return BadRequest("Minimum deposit amount is R10");

    if (request.Amount > 50000)
        return BadRequest("Maximum deposit amount is R50,000");

    var account = await _accountService.GetAccountAsync(DefaultAccountId);
    if (account == null)
        return NotFound("Account not found");

    try
    {
        var success = await _accountService.DepositAsync(DefaultAccountId, request.Amount, request.PaymentMethod);
        
        if (!success)
            return BadRequest("Deposit failed");

        return Ok(new { 
            Message = "Deposit completed successfully",
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            NewBalance = account.Balance + request.Amount
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { Message = "An error occurred while processing the deposit", Error = ex.Message });
    }
}

[HttpPost("withdraw")]
public async Task<ActionResult> Withdraw([FromBody] WithdrawRequest request)
{
    if (request.Amount <= 0)
        return BadRequest("Withdrawal amount must be greater than 0");

    if (request.Amount < 50)
        return BadRequest("Minimum withdrawal amount is R50");

    var account = await _accountService.GetAccountAsync(DefaultAccountId);
    if (account == null)
        return NotFound("Account not found");

    if (account.Balance < request.Amount)
        return BadRequest("Insufficient funds");

    try
    {
        var success = await _accountService.WithdrawAsync(DefaultAccountId, request.Amount, request.WithdrawalMethod);

        if (!success)
            return BadRequest("Withdrawal failed");

        return Ok(new
        {
            Message = "Withdrawal completed successfully",
            Amount = request.Amount,
            WithdrawalMethod = request.WithdrawalMethod,
            NewBalance = account.Balance - request.Amount
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500,
            new { Message = "An error occurred while processing the withdrawal", Error = ex.Message });
    }
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