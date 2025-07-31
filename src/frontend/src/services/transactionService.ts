import {
  type Transaction,
  type TransactionData,
  type TransactionDto,
  type TransactionSummary,
  type ITransactionService,
  ServiceError,
  NetworkError,
  ValidationError
} from '../types/services'

export class TransactionService implements ITransactionService {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  /**
   * Fetch transactions from backend API first, fallback to mock
   */
  async getTransactions(page: number = 1, pageSize: number = 20): Promise<TransactionData> {
    this.validatePaginationParams(page, pageSize)

    try {
      // Try backend API first
      const response: Response = await fetch(
        `${this.baseUrl}/Transactions?page=${page}&pageSize=${pageSize}`
      )

      if (response.ok) {
        const backendTransactions: TransactionDto[] = await response.json()
        console.log("Backend Transactions: ", backendTransactions)

        // Transform backend format to frontend format
        const transformedTransactions: any = backendTransactions.map((t: TransactionDto) => ({
          id: t.id.toString(),
          type: this.transformTransactionType(t.type),
          amount: Math.abs(t.amount),
          currency: 'ZAR',
          status: 'success',
          date: t.createdAt,
          description: t.description,
          recipient: t.recipient
        }))

        return {
          transactions: transformedTransactions,
          source: 'backend'
        }
      }
    } catch (error: any) {
      console.log('Backend API not available, trying mock data')
    }

    try {
      // Fallback to mock API
      const response: Response = await fetch('/api/transactions.json')
      if (response.ok) {
        const mockTransactions: Transaction[] = await response.json()
        return {
          transactions: mockTransactions,
          source: 'mock'
        }
      }
    } catch (error: any) {
      console.error('Mock API also failed:', error)
    }

    throw new NetworkError('Failed to fetch transactions from both backend and mock APIs')
  }

  /**
   * Transform backend transaction type to frontend format
   */
  transformTransactionType(backendType: string): string {
    if (typeof backendType !== 'string') {
      return 'unknown'
    }

    const typeMap: Record<string, string> = {
      'DEPOSIT': 'deposit',
      'WITHDRAWAL': 'withdrawal',
      'TRANSFER_IN': 'transferin',
      'TRANSFER_OUT': 'transferout',
      'LOAN': 'loan',
      'INTEREST': 'interest'
    }

    return typeMap[backendType.toUpperCase()] || backendType.toLowerCase().replace('_', '')
  }

  /**
   * Get user-friendly transaction type display name
   */
  getTransactionTypeDisplayName(type: string): string {
    const displayNames: Record<string, string> = {
      'deposit': 'Deposit',
      'withdrawal': 'Withdrawal',
      'transferin': 'Transfer In',
      'transferout': 'Transfer Out',
      'loan': 'Loan',
      'interest': 'Interest'
    }

    return displayNames[type] || type
  }

  /**
   * Get transaction type icon
   */
  getTransactionTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'deposit': 'mdi-plus-circle',
      'withdrawal': 'mdi-minus-circle',
      'transferin': 'mdi-arrow-down-circle',
      'transferout': 'mdi-arrow-up-circle',
      'loan': 'mdi-bank',
      'interest': 'mdi-percent'
    }

    return icons[type] || 'mdi-help-circle'
  }

  /**
   * Get transaction type color
   */
  getTransactionTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'deposit': 'success',
      'withdrawal': 'warning',
      'transferin': 'info',
      'transferout': 'primary',
      'loan': 'purple',
      'interest': 'teal'
    }

    return colors[type] || 'grey'
  }

  /**
   * Filter transactions by type
   */
  filterTransactionsByType(transactions: Transaction[], type: string): Transaction[] {
    if (!Array.isArray(transactions)) {
      throw new ValidationError('Transactions must be an array')
    }

    if (type === 'all') {
      return transactions
    }

    return transactions.filter((t: Transaction) => t.type === type)
  }

  /**
   * Sort transactions
   */
  sortTransactions(transactions: Transaction[], sortBy: string): Transaction[] {
    if (!Array.isArray(transactions)) {
      throw new ValidationError('Transactions must be an array')
    }

    const sorted: Transaction[] = [...transactions]

    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a: Transaction, b: Transaction) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      case 'date-asc':
        return sorted.sort((a: Transaction, b: Transaction) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      case 'amount-desc':
        return sorted.sort((a: Transaction, b: Transaction) => b.amount - a.amount)
      case 'amount-asc':
        return sorted.sort((a: Transaction, b: Transaction) => a.amount - b.amount)
      case 'type':
        return sorted.sort((a: Transaction, b: Transaction) => a.type.localeCompare(b.type))
      default:
        return sorted
    }
  }

  /**
   * Get transactions summary
   */
  getTransactionsSummary(transactions: Transaction[]): TransactionSummary {
    if (!Array.isArray(transactions)) {
      throw new ValidationError('Transactions must be an array')
    }

    const summary: TransactionSummary = {
      totalCount: transactions.length,
      totalDeposits: 0,
      totalWithdrawals: 0,
      totalTransfersIn: 0,
      totalTransfersOut: 0,
      totalLoans: 0,
      totalInterest: 0,
      countByType: {},
      amountByType: {}
    }

    transactions.forEach((t: Transaction) => {
      // Count by type
      summary.countByType[t.type] = (summary.countByType[t.type] || 0) + 1

      // Amount by type
      summary.amountByType[t.type] = (summary.amountByType[t.type] || 0) + t.amount

      // Specific totals
      switch (t.type) {
        case 'deposit':
          summary.totalDeposits += t.amount
          break
        case 'withdrawal':
          summary.totalWithdrawals += t.amount
          break
        case 'transferin':
          summary.totalTransfersIn += t.amount
          break
        case 'transferout':
          summary.totalTransfersOut += t.amount
          break
        case 'loan':
          summary.totalLoans += t.amount
          break
        case 'interest':
          summary.totalInterest += t.amount
          break
      }
    })

    return summary
  }

  /**
   * Get transactions for date range
   */
  getTransactionsForDateRange(transactions: Transaction[], startDate: string, endDate: string): Transaction[] {
    if (!Array.isArray(transactions)) {
      throw new ValidationError('Transactions must be an array')
    }

    const start: Date = new Date(startDate)
    const end: Date = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ValidationError('Invalid date format')
    }

    if (start > end) {
      throw new ValidationError('Start date must be before end date')
    }

    return transactions.filter((t: Transaction) => {
      const transactionDate: Date = new Date(t.date)
      return transactionDate >= start && transactionDate <= end
    })
  }

  /**
   * Search transactions
   */
  searchTransactions(transactions: Transaction[], searchTerm: string): Transaction[] {
    if (!Array.isArray(transactions)) {
      throw new ValidationError('Transactions must be an array')
    }

    if (!searchTerm || typeof searchTerm !== 'string') return transactions

    const term: string = searchTerm.toLowerCase()

    return transactions.filter((t: Transaction) =>
      t.description.toLowerCase().includes(term) ||
      t.type.toLowerCase().includes(term) ||
      (t.recipient && t.recipient.toLowerCase().includes(term)) ||
      t.amount.toString().includes(term)
    )
  }

  /**
   * Get recent transactions (last N transactions)
   */
  getRecentTransactions(transactions: Transaction[], count: number = 10): Transaction[] {
    if (!Array.isArray(transactions)) {
      throw new ValidationError('Transactions must be an array')
    }

    if (typeof count !== 'number' || count < 0) {
      throw new ValidationError('Count must be a non-negative number')
    }

    return this.sortTransactions(transactions, 'date-desc').slice(0, count)
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
  private validatePaginationParams(page: number, pageSize: number): void {
    if (typeof page !== 'number' || page < 1) {
      throw new ValidationError('Page must be a positive number')
    }
    if (typeof pageSize !== 'number' || pageSize < 1 || pageSize > 100) {
      throw new ValidationError('Page size must be between 1 and 100')
    }
  }
}
