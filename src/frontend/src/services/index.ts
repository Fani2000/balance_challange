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
    apiBaseUrl: (import.meta.env.VITE_API_URL ?? process.env.VITE_API_URL) + "/api",
    retryAttempts: 2
}


// Enhanced service factory with proper typing
class ServiceFactory {
  private config: ServiceConfig
  private services: Map<string, IWalletService | ITransactionService>

  constructor(baseConfig: ServiceConfig) {
    console.log("Process: ", process.env.VITE_API_URL)
    console.log("ProcessENV: ", process.env)
    console.log("ProcessENV: ", import.meta.env)
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
