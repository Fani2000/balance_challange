export interface WalletBalance {
  balance: number
  currency: string
  source: 'backend' | 'mock'
}

export interface AccountSummary {
  totalIn: number
  totalOut: number
  interest: number
}

export interface TransactionDto {
  id: number
  type: string
  amount: number
  description: string
  recipient?: string
  createdAt: string
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  date: string
  description: string
  recipient?: string
}

export interface TransactionData {
  transactions: Transaction[]
  source: 'backend' | 'mock'
}

export interface DepositRequest {
  amount: number
  paymentMethod: string
}

export interface WithdrawRequest {
  amount: number
  withdrawalMethod: string
}

export interface TransferRequest {
  recipient: string
  amount: number
}

export interface LoanRequest {
  amount: number
}

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  success?: boolean
}

export interface ErrorResponse {
  message: string
  code?: string | number
  details?: any
}

// Enums
export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  TRANSFER_IN = 'transferin',
  TRANSFER_OUT = 'transferout',
  LOAN = 'loan',
  INTEREST = 'interest'
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  CREDIT_CARD = 'Credit Card',
  INSTANT_EFT = 'Instant EFT',
  E_WALLET = 'E-Wallet',
  CRYPTOCURRENCY = 'Cryptocurrency'
}

export enum WithdrawalMethod {
  BANK_ACCOUNT = 'Bank Account',
  E_WALLET = 'E-Wallet',
  DEBIT_CARD = 'Debit Card'
}

// Service interfaces
export interface IWalletService {
  getWalletBalance(): Promise<WalletBalance>
  getAccountSummary(): Promise<AccountSummary>
  transferMoney(recipient: string, amount: number): Promise<ApiResponse>
  requestLoan(amount: number): Promise<ApiResponse>
  deposit(amount: number, paymentMethod: string): Promise<ApiResponse>
  withdraw(amount: number, withdrawalMethod: string): Promise<ApiResponse>
  healthCheck(): Promise<boolean>
  setBaseUrl(newBaseUrl: string): void
  getBaseUrl(): string
}

export interface ITransactionService {
  getTransactions(page?: number, pageSize?: number): Promise<TransactionData>
  transformTransactionType(backendType: string): string
  getTransactionTypeDisplayName(type: string): string
  getTransactionTypeIcon(type: string): string
  getTransactionTypeColor(type: string): string
  filterTransactionsByType(transactions: Transaction[], type: string): Transaction[]
  sortTransactions(transactions: Transaction[], sortBy: string): Transaction[]
  getTransactionsSummary(transactions: Transaction[]): any
  getTransactionsForDateRange(transactions: Transaction[], startDate: string, endDate: string): Transaction[]
  searchTransactions(transactions: Transaction[], searchTerm: string): Transaction[]
  getRecentTransactions(transactions: Transaction[], count?: number): Transaction[]
  healthCheck(): Promise<boolean>
  setBaseUrl(newBaseUrl: string): void
  getBaseUrl(): string
}

// Configuration types
export interface ServiceConfig {
  apiBaseUrl: string
  timeout: number
  retryAttempts: number
  enableMockFallback: boolean
  enableDebugLogging: boolean
}

export interface HealthCheckResult {
  wallet: boolean
  transaction: boolean
}

// Utility types
export type TransactionFilter = 'all' | TransactionType
export type TransactionSort = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'type'

export interface TransactionSummary {
  totalCount: number
  totalDeposits: number
  totalWithdrawals: number
  totalTransfersIn: number
  totalTransfersOut: number
  totalLoans: number
  totalInterest: number
  countByType: { [key: string]: number }
  amountByType: { [key: string]: number }
}

export interface PaginationInfo {
  currentPage: number
  pageSize: number
  totalCount: number
  hasMore: boolean
  isLoadingMore: boolean
}

// Error types
export class ServiceError extends Error {
  public code?: string | number
  public details?: any

  constructor(message: string, code?: string | number, details?: any) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.details = details
  }
}

export class NetworkError extends ServiceError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR')
    this.name = 'NetworkError'
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ServiceError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class InsufficientFundsError extends ServiceError {
  constructor(message: string = 'Insufficient funds') {
    super(message, 'INSUFFICIENT_FUNDS')
    this.name = 'InsufficientFundsError'
  }
}
