import { WalletService } from './walletService'
import { TransactionService } from './transactionService'
import type {
  ServiceConfig,
  HealthCheckResult,
  IWalletService,
  ITransactionService
} from '../types/services'


// Configuration
const config:any = {
  apiBaseUrl: process.env.VITE_API_URL + "/api" || import.meta.env.VITE_API_URL,
  retryAttempts: 2
}

// Enhanced service factory with proper typing
class ServiceFactory {
  private config: ServiceConfig
  private services: Map<string, IWalletService | ITransactionService>

  constructor(baseConfig: ServiceConfig) {
    this.config = baseConfig
    this.services = new Map()
  }

  getWalletService(): IWalletService {
    if (!this.services.has('wallet')) {
      const service = new WalletService(this.config.apiBaseUrl)
      this.services.set('wallet', service)
    }
    return this.services.get('wallet') as IWalletService
  }

  getTransactionService(): ITransactionService {
    if (!this.services.has('transaction')) {
      const service = new TransactionService(this.config.apiBaseUrl)
      this.services.set('transaction', service)
    }
    return this.services.get('transaction') as ITransactionService
  }

  // Method to update API base URL (useful for dynamic environments)
  updateApiBaseUrl(newBaseUrl: string): void {
    if (!newBaseUrl || typeof newBaseUrl !== 'string') {
      throw new Error('Base URL must be a valid string')
    }

    this.config.apiBaseUrl = newBaseUrl
    // Clear existing services to force recreation with new URL
    this.services.clear()

    if (this.config.enableDebugLogging) {
      console.log(`Service factory: Updated API base URL to ${newBaseUrl}`)
    }
  }

  // Get current configuration
  getConfig(): ServiceConfig {
    return { ...this.config }
  }

  // Update configuration
  updateConfig(newConfig: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...newConfig }

    if (this.config.enableDebugLogging) {
      console.log('Service factory: Updated configuration', this.config)
    }
  }

  // Health check for all services
  async healthCheck(): Promise<HealthCheckResult> {
    const results: HealthCheckResult = {
      wallet: false,
      transaction: false
    }

    try {
      const walletService = this.getWalletService()
      results.wallet = await walletService.healthCheck()
    } catch (error: any) {
      console.error('Wallet service health check failed:', error)
      results.wallet = false
    }

    try {
      const transactionService = this.getTransactionService()
      results.transaction = await transactionService.healthCheck()
    } catch (error: any) {
      console.error('Transaction service health check failed:', error)
      results.transaction = false
    }

    return results
  }

  // Reset all services (useful for testing or reinitialization)
  resetServices(): void {
    this.services.clear()

    if (this.config.enableDebugLogging) {
      console.log('Service factory: All services reset')
    }
  }

  // Get service instance count
  getServiceCount(): number {
    return this.services.size
  }

  // Check if service exists
  hasService(serviceName: string): boolean {
    return this.services.has(serviceName)
  }
}

// Utility functions with proper typing
export const ServiceUtils = {
  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string = 'ZAR'): string {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number')
    }

    try {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(amount)
    } catch (error: any) {
      // Fallback formatting
      return `${currency} ${amount.toFixed(2)}`
    }
  },

  /**
   * Format date for display
   */
  formatDate(date: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date provided')
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }

    try {
      return new Intl.DateTimeFormat('en-ZA', { ...defaultOptions, ...options })
        .format(dateObj)
    } catch (error: any) {
      // Fallback formatting
      return dateObj.toLocaleString()
    }
  },

  /**
   * Validate amount
   */
  validateAmount(amount: number, min: number = 0, max: number = Infinity): boolean {
    if (typeof amount !== 'number') return false
    const num = parseFloat(amount.toString())
    return !isNaN(num) && num >= min && num <= max
  },

  /**
   * Debounce function for API calls
   */
  debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    if (typeof func !== 'function') {
      throw new Error('First argument must be a function')
    }
    if (typeof wait !== 'number' || wait < 0) {
      throw new Error('Wait time must be a non-negative number')
    }

    let timeout: NodeJS.Timeout | null = null

    return function executedFunction(...args: Parameters<T>): void {
      const later = (): void => {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        func(...args)
      }

      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(later, wait)
    }
  },

  /**
   * Retry function for failed API calls
   */
  async retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    if (typeof fn !== 'function') {
      throw new Error('First argument must be a function')
    }
    if (typeof retries !== 'number' || retries < 0) {
      throw new Error('Retries must be a non-negative number')
    }
    if (typeof delay !== 'number' || delay < 0) {
      throw new Error('Delay must be a non-negative number')
    }

    try {
      return await fn()
    } catch (error: any) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.retry(fn, retries - 1, delay * 2)
      }
      throw error
    }
  },

  /**
   * Safe JSON parse with fallback
   */
  safeJsonParse<T>(jsonString: string, fallback: T): T {
    try {
      return JSON.parse(jsonString) as T
    } catch (error: any) {
      console.warn('Failed to parse JSON:', error)
      return fallback
    }
  },

  /**
   * Generate unique ID
   */
  generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export types for TypeScript users
export const TransactionTypes = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRANSFER_IN: 'transferin',
  TRANSFER_OUT: 'transferout',
  LOAN: 'loan',
  INTEREST: 'interest'
} as const

export const PaymentMethods = {
  CREDIT_CARD: 'Credit Card',
  INSTANT_EFT: 'Instant EFT',
  E_WALLET: 'E-Wallet',
  CRYPTOCURRENCY: 'Cryptocurrency'
} as const

export const WithdrawalMethods = {
  BANK_ACCOUNT: 'Bank Account',
  E_WALLET: 'E-Wallet',
  DEBIT_CARD: 'Debit Card'
} as const

// Type exports
export type {
  ServiceConfig,
  HealthCheckResult,
  IWalletService,
  ITransactionService
} from '../types/services'

// Default export
export const serviceFactory = new ServiceFactory(config)

// Export individual services for convenience
export const walletService = serviceFactory.getWalletService()
export const transactionService = serviceFactory.getTransactionService()

// Export config for reference
export { config }
