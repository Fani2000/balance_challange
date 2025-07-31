import {
  type WalletBalance,
  type AccountSummary,
  type ApiResponse,
  type IWalletService,
  ServiceError,
  NetworkError,
  ValidationError,
  InsufficientFundsError
} from '../types/services'

export class WalletService implements IWalletService {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  /**
   * Fetch wallet balance from backend API first, fallback to mock
   */
  async getWalletBalance(): Promise<WalletBalance> {
    /*
    try {
      // Try backend API first
      const response: Response = await fetch(`${this.baseUrl}/Account`)
      if (response.ok) {
        const account: any = await response.json()
        return {
          balance: account.balance,
          currency: 'ZAR',
          source: 'backend'
        }
      }
    } catch (error: any) {
      console.log('Backend API not available, trying mock data')
    }
     */

    try {
      // Fallback to mock API
      const response: Response = await fetch('/api/wallet.json')
      if (response.ok) {
        const data: any = await response.json()
        return {
          balance: data.balance,
          currency: 'ZAR',
          source: 'mock'
        }
      }
    } catch (error: any) {
      console.error('Mock API also failed:', error)
    }

    throw new NetworkError('Failed to fetch wallet balance from both backend and mock APIs')
  }

  /**
   * Get account summary from backend
   */
  async getAccountSummary(): Promise<AccountSummary> {
    try {
      const response: Response = await fetch(`${this.baseUrl}/Account/summary`)
      if (response.ok) {
        return await response.json()
      }

      throw new ServiceError(`Failed to fetch account summary: ${response.status}`)
    } catch (error: any) {
      console.error('Failed to fetch account summary:', error)
      throw new ServiceError('Failed to fetch account summary')
    }
  }

  /**
   * Transfer money
   */
  async transferMoney(recipient: string, amount: number): Promise<ApiResponse> {
    this.validateTransferParams(recipient, amount)

    try {
      const response: Response = await fetch(`${this.baseUrl}/Account/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient,
          amount
        })
      })

      if (response.ok) {
        return await response.json()
      }

      // Handle error responses
      const errorData: any = await response.json().catch(() => ({}))

      if (response.status === 400) {
        if (errorData.message?.includes('Insufficient')) {
          throw new InsufficientFundsError(errorData.message)
        }
        throw new ValidationError(errorData.message || 'Invalid transfer request')
      } else if (response.status === 404) {
        throw new ValidationError('Recipient not found')
      } else if (response.status >= 500) {
        throw new ServiceError('Server error occurred. Please try again later.')
      }

      throw new ServiceError(errorData.message || 'Transfer failed')
    } catch (error: any) {
      console.error('Transfer error:', error)
      if (error instanceof ServiceError) {
        throw error
      }
      throw new NetworkError('Transfer request failed')
    }
  }

  /**
   * Request loan
   */
  async requestLoan(amount: number): Promise<ApiResponse> {
    this.validateAmount(amount)

    try {
      const response: Response = await fetch(`${this.baseUrl}/Account/loan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount
        })
      })

      if (response.ok) {
        return await response.json()
      }

      const errorData: any = await response.json().catch(() => ({}))

      if (response.status === 400) {
        throw new ValidationError(errorData.message || 'Invalid loan request')
      } else if (response.status === 404) {
        throw new ValidationError('Account not found')
      } else if (response.status >= 500) {
        throw new ServiceError('Server error occurred. Please try again later.')
      }

      throw new ServiceError(errorData.message || 'Loan request failed')
    } catch (error: any) {
      console.error('Loan request error:', error)
      if (error instanceof ServiceError) {
        throw error
      }
      throw new NetworkError('Loan request failed')
    }
  }

  /**
   * Deposit money
   */
  async deposit(amount: number, paymentMethod: string): Promise<ApiResponse> {
    this.validateDepositParams(amount, paymentMethod)

    try {
      const response: Response = await fetch(`${this.baseUrl}/Account/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          paymentMethod
        })
      })

      if (response.ok) {
        return await response.json()
      }

      // Handle error responses
      const errorData: any = await response.json().catch(() => ({}))

      if (response.status === 400) {
        throw new ValidationError(errorData.message || 'Invalid deposit request')
      } else if (response.status === 404) {
        throw new ValidationError('Account not found')
      } else if (response.status >= 500) {
        throw new ServiceError('Server error occurred. Please try again later.')
      }

      throw new ServiceError(errorData.message || 'Deposit failed')
    } catch (error: any) {
      console.error('Deposit error:', error)
      if (error instanceof ServiceError) {
        throw error
      }
      throw new NetworkError('Deposit request failed')
    }
  }

  /**
   * Withdraw money
   */
  async withdraw(amount: number, withdrawalMethod: string): Promise<ApiResponse> {
    this.validateWithdrawParams(amount, withdrawalMethod)

    try {
      const response: Response = await fetch(`${this.baseUrl}/Account/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          withdrawalMethod
        })
      })

      if (response.ok) {
        return await response.json()
      }

      // Handle error responses
      const errorData: any = await response.json().catch(() => ({}))

      if (response.status === 400) {
        if (errorData.message?.includes('Insufficient')) {
          throw new InsufficientFundsError(errorData.message)
        }
        throw new ValidationError(errorData.message || 'Invalid withdrawal request')
      } else if (response.status === 404) {
        throw new ValidationError('Account not found')
      } else if (response.status >= 500) {
        throw new ServiceError('Server error occurred. Please try again later.')
      }

      throw new ServiceError(errorData.message || 'Withdrawal failed')
    } catch (error: any) {
      console.error('Withdrawal error:', error)
      if (error instanceof ServiceError) {
        throw error
      }
      throw new NetworkError('Withdrawal request failed')
    }
  }

  /**
   * Check if backend is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response: Response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      return response.ok
    } catch (error: any) {
      console.error('Health check failed:', error)
      return false
    }
  }

  /**
   * Set base URL (useful for dynamic environments)
   */
  setBaseUrl(newBaseUrl: string): void {
    if (!newBaseUrl || typeof newBaseUrl !== 'string') {
      throw new ValidationError('Base URL must be a valid string')
    }
    this.baseUrl = newBaseUrl
  }

  /**
   * Get current base URL
   */
  getBaseUrl(): string {
    return this.baseUrl
  }

  // Private validation methods
  private validateAmount(amount: number): void {
    if (typeof amount !== 'number' || amount <= 0) {
      throw new ValidationError('Amount must be a positive number')
    }
    if (amount > 1000000) {
      throw new ValidationError('Amount exceeds maximum limit')
    }
  }

  private validateTransferParams(recipient: string, amount: number): void {
    if (!recipient || typeof recipient !== 'string' || recipient.trim().length === 0) {
      throw new ValidationError('Recipient is required')
    }
    this.validateAmount(amount)
  }

  private validateDepositParams(amount: number, paymentMethod: string): void {
    this.validateAmount(amount)
    if (amount < 10) {
      throw new ValidationError('Minimum deposit amount is R10')
    }
    if (amount > 50000) {
      throw new ValidationError('Maximum deposit amount is R50,000')
    }
    if (!paymentMethod || typeof paymentMethod !== 'string') {
      throw new ValidationError('Payment method is required')
    }
  }

  private validateWithdrawParams(amount: number, withdrawalMethod: string): void {
    this.validateAmount(amount)
    if (amount < 50) {
      throw new ValidationError('Minimum withdrawal amount is R50')
    }
    if (!withdrawalMethod || typeof withdrawalMethod !== 'string') {
      throw new ValidationError('Withdrawal method is required')
    }
  }
}
