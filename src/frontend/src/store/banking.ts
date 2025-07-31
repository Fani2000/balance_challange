import { defineStore } from 'pinia'
import { walletService, transactionService } from '../services/index'
import type { AccountSummary, BankingState, Transaction, TransactionData, WalletData, Wallet } from '../types/store'

export const useBankingStore = defineStore('banking', {
  state: (): BankingState => ({
    wallet: null,
    transactions: [],
    accountSummary: null,
    loading: false,
    error: null,
    dataSource: {
      wallet: null,
      transactions: null
    },
    transactionPagination: {
      currentPage: 1,
      pageSize: 6,
      totalCount: 0,
      hasMore: true,
      isLoadingMore: false
    },
    lastSyncTimestamp: null,
    pendingTransactions: new Set<string>()
  }),

  // ========================================
  // GETTERS
  // ========================================
  getters: {
    // Basic wallet getters
    walletBalance: (state: BankingState): number => state.wallet?.balance || 0,
    walletCurrency: (state: BankingState): string => state.wallet?.currency || 'ZAR',

    // Transaction getters
    recentTransactions: (state: BankingState): Transaction[] => state.transactions.slice(0, 10),
    confirmedTransactions: (state: BankingState): Transaction[] => {
      return state.transactions.filter((t: Transaction) =>
        !t.id.toString().startsWith('temp_') && t.status !== 'pending'
      )
    },
    pendingTransactionsArray: (state: BankingState): Transaction[] => {
      return state.transactions.filter((t: Transaction) =>
        t.id.toString().startsWith('temp_') || t.status === 'pending'
      )
    },

    // Financial calculations
    totalDeposits: (state: BankingState): number => {
      return state.transactions
        .filter((t: Transaction) =>
          ['deposit', 'transferin', 'loan', 'interest'].includes(t.type) && t.status === 'success'
        )
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
    },
    totalWithdrawals: (state: BankingState): number => {
      return state.transactions
        .filter((t: Transaction) =>
          ['withdrawal', 'transferout'].includes(t.type) && t.status === 'success'
        )
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0)
    },
    netBalance: (state: BankingState): number => {
      const deposits = state.transactions
        .filter((t: Transaction) => ['deposit', 'transferin', 'loan', 'interest'].includes(t.type))
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0)

      const withdrawals = state.transactions
        .filter((t: Transaction) => ['withdrawal', 'transferout'].includes(t.type))
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0)

      return deposits - withdrawals
    },

    // Utility getters
    transactionsByType: (state: BankingState) => {
      return state.transactions.reduce((acc: any, transaction: Transaction) => {
        const type = transaction.type
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(transaction)
        return acc
      }, {})
    },
    isUsingBackend: (state: BankingState): boolean => {
      return state.dataSource.wallet === 'backend' || state.dataSource.transactions === 'backend'
    }
  },

  // ========================================
  // ACTIONS
  // ========================================
  actions: {
    // ========================================
    // DATA FETCHING METHODS
    // ========================================

    async fetchWallet(): Promise<Wallet | null> {
      this.loading = true
      this.clearError()

      try {
        const walletData: WalletData = await walletService.getWalletBalance()

        // Only update if balance actually changed
        if (!this.wallet || this.wallet.balance !== walletData.balance) {
          this.wallet = {
            balance: walletData.balance,
            currency: walletData.currency
          }
          console.log(`💰 Wallet balance updated: ${walletData.balance}`)
        }

        this.dataSource.wallet = walletData.source
        return this.wallet
      } catch (error: any) {
        this.error = `Failed to fetch wallet: ${error.message}`
        console.error('❌ Store: Error fetching wallet:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTransactions(page: number = 1, pageSize: number = 20, append: boolean = false): Promise<Transaction[]> {
      // Prevent duplicate loading
      if (append && this.transactionPagination.isLoadingMore) {
        return this.transactions
      }

      if (append) {
        this.transactionPagination.isLoadingMore = true
      } else {
        this.loading = true
      }

      try {
        const transactionData: TransactionData = await transactionService.getTransactions(page, pageSize)

        if (append && this.transactions.length > 0) {
          // Append mode: add only new transactions
          const existingIds: Set<string> = new Set(this.transactions.map((t: Transaction) => t.id))
          const newTransactions: Transaction[] = transactionData.transactions.filter((t: Transaction) => {
            return !existingIds.has(t.id) && !this.isDuplicateTransaction(t, this.transactions)
          })

          if (newTransactions.length > 0) {
            this.transactions = this.mergeTransactions(newTransactions, this.transactions)
            console.log(`📥 Added ${newTransactions.length} new transactions via append`)
          }

          this.transactionPagination.hasMore = newTransactions.length === pageSize
          this.transactionPagination.currentPage = page
        } else {
          // Refresh mode: merge all transactions intelligently
          const mergedTransactions = this.mergeTransactions(transactionData.transactions, this.transactions)

          // Only update if there are actual changes
          if (mergedTransactions.length !== this.transactions.length ||
            !mergedTransactions.every((t, i) => t.id === this.transactions[i]?.id)) {
            this.transactions = mergedTransactions
            console.log(`🔄 Refreshed transactions list with ${transactionData.transactions.length} from API`)
          }

          this.transactionPagination.currentPage = page
          this.transactionPagination.hasMore = transactionData.transactions.length === pageSize
        }

        this.dataSource.transactions = transactionData.source
        this.lastSyncTimestamp = Date.now()
        this.cleanupOrphanedOptimisticTransactions()

        if (this.error?.includes('transactions')) {
          this.error = null
        }

        return this.transactions
      } catch (error: any) {
        if (this.error) {
          this.error = `Failed to fetch wallet data and transactions: ${error.message}`
        } else {
          console.error('❌ Store: Error fetching transactions:', error)
        }
        throw error
      } finally {
        this.loading = false
        this.transactionPagination.isLoadingMore = false
      }
    },

    async fetchAccount(): Promise<any> {
      this.loading = true
      this.clearError()

      try {
        const walletData: WalletData = await walletService.getWalletBalance()
        const account = {
          balance: walletData.balance,
          currency: walletData.currency,
          source: walletData.source
        }

        if (!this.wallet || this.wallet.balance !== account.balance) {
          this.wallet = {
            balance: account.balance,
            currency: account.currency
          }
        }
        this.dataSource.wallet = account.source

        console.log("📊 Account Data:", account)
        return account
      } catch (error: any) {
        this.error = `Failed to fetch account: ${error.message}`
        console.error('❌ Store: Error fetching account:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchAccountSummary(): Promise<AccountSummary | null> {
      this.loading = true

      try {
        const summary: AccountSummary = await walletService.getAccountSummary()

        if (JSON.stringify(this.accountSummary) !== JSON.stringify(summary)) {
          this.accountSummary = summary
          console.log('📈 Account summary updated')
        }

        return summary
      } catch (error: any) {
        console.error('❌ Store: Error fetching account summary:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    // ========================================
    // TRANSACTION OPERATIONS
    // ========================================

    async deposit(amount: number, paymentMethod: string): Promise<any> {
      this.loading = true
      this.clearError()

      // Create unique optimistic transaction
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substr(2, 8)
      const optimisticTransaction: Transaction = {
        id: `temp_deposit_${timestamp}_${randomSuffix}`,
        type: 'deposit',
        amount: amount,
        currency: this.walletCurrency,
        status: 'pending',
        date: new Date().toISOString(),
        description: `Deposit via ${paymentMethod}`
      }

      try {
        // Add optimistic transaction and update balance
        this.addOptimisticTransaction(optimisticTransaction)
        if (this.wallet) {
          this.wallet.balance += amount
        }

        console.log(`💳 Starting deposit: ${amount} via ${paymentMethod}`)

        // Call API
        const result: any = await walletService.deposit(amount, paymentMethod)

        console.log(`✅ Deposit API successful, removing optimistic transaction`)
        this.removeOptimisticTransaction(optimisticTransaction.id)

        // Sync with backend after delay
        setTimeout(async () => {
          console.log(`🔄 Starting smart sync after deposit...`)
          await this.smartSync()
        }, 2000)

        return result
      } catch (error: any) {
        console.log(`❌ Deposit failed, reverting changes`)

        // Revert changes on error
        if (this.wallet) {
          this.wallet.balance -= amount
        }
        this.removeOptimisticTransaction(optimisticTransaction.id)
        this.error = `Deposit failed: ${error.message}`
        throw error
      } finally {
        this.loading = false
      }
    },

    async withdraw(amount: number, method: string): Promise<any> {
      this.loading = true
      this.clearError()

      // Check sufficient funds
      if (this.wallet && this.wallet.balance < amount) {
        this.loading = false
        const error = new Error('Insufficient funds')
        this.error = `Withdrawal failed: ${error.message}`
        throw error
      }

      // Create unique optimistic transaction
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substr(2, 8)
      const optimisticTransaction: Transaction = {
        id: `temp_withdraw_${timestamp}_${randomSuffix}`,
        type: 'withdrawal',
        amount: amount,
        currency: this.walletCurrency,
        status: 'pending',
        date: new Date().toISOString(),
        description: `Withdrawal to ${method}`
      }

      try {
        // Add optimistic transaction and update balance
        this.addOptimisticTransaction(optimisticTransaction)
        if (this.wallet) {
          this.wallet.balance -= amount
        }

        console.log(`💸 Starting withdrawal: ${amount} to ${method}`)

        // Call API
        const result: any = await walletService.withdraw(amount, method)

        console.log(`✅ Withdrawal API successful, removing optimistic transaction`)
        this.removeOptimisticTransaction(optimisticTransaction.id)

        // Sync with backend after delay
        setTimeout(async () => {
          console.log(`🔄 Starting smart sync after withdrawal...`)
          await this.smartSync()
        }, 2000)

        return result
      } catch (error: any) {
        console.log(`❌ Withdrawal failed, reverting changes`)

        // Revert changes on error
        if (this.wallet) {
          this.wallet.balance += amount
        }
        this.removeOptimisticTransaction(optimisticTransaction.id)
        this.error = `Withdrawal failed: ${error.message}`
        throw error
      } finally {
        this.loading = false
      }
    },

    async transferMoney(recipient: string, amount: number): Promise<any> {
      this.loading = true
      this.clearError()

      try {
        const result: any = await walletService.transferMoney(recipient, amount)
        await this.smartSync()
        return result
      } catch (error: any) {
        this.error = `Transfer failed: ${error.message}`
        throw error
      } finally {
        this.loading = false
      }
    },

    async requestLoan(amount: number): Promise<any> {
      this.loading = true
      this.clearError()

      try {
        const result: any = await walletService.requestLoan(amount)
        await this.smartSync()
        return result
      } catch (error: any) {
        this.error = `Loan request failed: ${error.message}`
        throw error
      } finally {
        this.loading = false
      }
    },

    // ========================================
    // SYNC AND PAGINATION METHODS
    // ========================================

    async smartSync(): Promise<void> {
      try {
        this.logTransactionState('before smartSync')

        // Sync wallet balance
        const currentBalance: number = this.walletBalance
        const walletData: WalletData = await walletService.getWalletBalance()

        if (Math.abs(walletData.balance - currentBalance) > 0.01) {
          this.wallet = {
            balance: walletData.balance,
            currency: walletData.currency
          }
          console.log(`💰 Balance synced: ${currentBalance} → ${walletData.balance}`)
        }

        // Sync transactions
        const transactionData: TransactionData = await transactionService.getTransactions(1, 10)
        console.log(`📥 Fetched ${transactionData.transactions.length} transactions from server`)

        // Find new transactions
        const confirmedTransactions = this.transactions.filter((t: Transaction) =>
          !t.id.toString().startsWith('temp_')
        )

        const existingIds: Set<string> = new Set(confirmedTransactions.map((t: Transaction) => t.id))
        const newTransactions: Transaction[] = transactionData.transactions.filter((t: Transaction) => {
          const isNew = !existingIds.has(t.id)
          if (!isNew) {
            console.log(`⏭️ Skipping existing transaction: ${t.id}`)
          }
          return isNew
        })

        console.log(`🆕 Found ${newTransactions.length} genuinely new transactions`)

        // Add new transactions
        if (newTransactions.length > 0) {
          newTransactions.forEach((transaction: Transaction, index: number) => {
            console.log(`➕ Adding new transaction ${index + 1}/${newTransactions.length}: ${transaction.type} ${transaction.amount}`)

            if (!this.isDuplicateTransaction(transaction, this.transactions)) {
              this.addNewTransaction(transaction)
            } else {
              console.log(`🚫 Rejected duplicate: ${transaction.type} ${transaction.amount}`)
            }
          })
        }

        this.cleanupOrphanedOptimisticTransactions()
        this.lastSyncTimestamp = Date.now()
        this.logTransactionState('after smartSync')

      } catch (error: any) {
        console.error('❌ Smart sync failed:', error)
      }
    },

    async loadMoreTransactions(): Promise<Transaction[]> {
      if (!this.transactionPagination.hasMore || this.transactionPagination.isLoadingMore) {
        return this.transactions
      }

      const nextPage: number = this.transactionPagination.currentPage + 1
      return this.fetchTransactions(nextPage, this.transactionPagination.pageSize, true)
    },

    async refreshTransactions(): Promise<Transaction[]> {
      this.transactionPagination.currentPage = 1
      this.transactionPagination.hasMore = true
      return this.fetchTransactions(1, this.transactionPagination.pageSize, false)
    },

    async refreshAllData(): Promise<void> {
      this.loading = true

      try {
        await Promise.all([
          this.fetchWallet(),
          this.refreshTransactions(),
          this.fetchAccountSummary()
        ])
      } catch (error: any) {
        console.error('❌ Store: Error refreshing data:', error)
      } finally {
        this.loading = false
      }
    },

    // ========================================
    // TRANSACTION MANAGEMENT METHODS
    // ========================================

    addOptimisticTransaction(transaction: Transaction): void {
      // Check for similar pending transactions
      const hasSimilarPending = this.transactions.some((t: Transaction) =>
        t.id.toString().startsWith('temp_') &&
        t.type === transaction.type &&
        Math.abs(t.amount - transaction.amount) < 0.01 &&
        t.status === 'pending'
      )

      if (hasSimilarPending) {
        console.warn(`⚠️ Already have similar pending transaction, skipping`)
        return
      }

      const optimisticTx: Transaction = {
        ...transaction,
        status: 'pending',
        date: new Date().toISOString(),
        currency: this.walletCurrency
      }

      this.transactions.unshift(optimisticTx)
      this.pendingTransactions.add(optimisticTx.id)
      console.log(`✅ Added optimistic: ${optimisticTx.type} ${optimisticTx.amount} (${optimisticTx.id})`)
    },

    removeOptimisticTransaction(tempId: string): void {
      const beforeCount = this.transactions.length
      const transactionToRemove = this.transactions.find(t => t.id === tempId)

      if (transactionToRemove) {
        console.log(`🗑️ Removing optimistic: ${transactionToRemove.type} ${transactionToRemove.amount}`)
      }

      this.transactions = this.transactions.filter((t: Transaction) => t.id !== tempId)
      this.pendingTransactions.delete(tempId)

      const removedCount = beforeCount - this.transactions.length
      if (removedCount > 0) {
        console.log(`✅ Successfully removed ${removedCount} optimistic transaction(s)`)
      } else {
        console.warn(`⚠️ Could not find optimistic transaction: ${tempId}`)
        this.logTempTransactions()
      }
    },

    addNewTransaction(transaction: Transaction): void {
      // Check for exact ID duplicates
      const existingIndex: number = this.transactions.findIndex((t: Transaction) => t.id === transaction.id)

      if (existingIndex !== -1) {
        this.transactions[existingIndex] = transaction
        console.log(`🔄 Updated existing transaction: ${transaction.id}`)
        return
      }

      // Check for potential duplicates
      if (this.isDuplicateTransaction(transaction, this.transactions)) {
        console.log(`🚫 Skipping duplicate: ${transaction.id} (${transaction.type} ${transaction.amount})`)
        return
      }

      // Add new transaction
      this.transactions.unshift(transaction)
      this.transactionPagination.totalCount += 1
      console.log(`➕ Added new: ${transaction.type} ${transaction.amount} (${transaction.id})`)
    },

    updateTransactionStatus(id: string, status: string, realTransaction: Transaction | null = null): void {
      const index: number = this.transactions.findIndex((t: Transaction) => t.id === id)
      if (index !== -1) {
        if (realTransaction) {
          this.transactions[index] = realTransaction
        } else {
          this.transactions[index] = { ...this.transactions[index], status }
        }

        if (status === 'success') {
          this.pendingTransactions.delete(id)
        }
      }
    },

    // ========================================
    // UTILITY METHODS
    // ========================================

    isDuplicateTransaction(newTransaction: Transaction, existingTransactions: Transaction[]): boolean {
      return existingTransactions.some((existing: Transaction) => {
        // Exact ID match
        if (existing.id === newTransaction.id) {
          return true
        }

        // Skip comparison with temp transactions of different types
        if (existing.id.toString().startsWith('temp_') && existing.type !== newTransaction.type) {
          return false
        }

        // Check multiple criteria for potential duplicates
        const timeDiff = Math.abs(
          new Date(existing.date).getTime() - new Date(newTransaction.date).getTime()
        )

        const amountMatch = Math.abs(existing.amount - newTransaction.amount) < 0.01
        const typeMatch = existing.type === newTransaction.type
        const timeMatch = timeDiff < 30000 // Within 30 seconds

        const descriptionSimilar = existing.description.toLowerCase().includes(newTransaction.type.toLowerCase()) ||
          newTransaction.description.toLowerCase().includes(existing.type.toLowerCase())

        return amountMatch && typeMatch && timeMatch && descriptionSimilar
      })
    },

    mergeTransactions(newTransactions: Transaction[], existingTransactions: Transaction[]): Transaction[] {
      const merged: Transaction[] = []
      const processedIds: Set<string> = new Set()

      // Add new transactions first
      newTransactions.forEach((transaction: Transaction) => {
        if (!this.isDuplicateTransaction(transaction, merged)) {
          merged.push(transaction)
          processedIds.add(transaction.id)
        }
      })

      // Add existing transactions that aren't duplicates
      existingTransactions.forEach((transaction: Transaction) => {
        if (!processedIds.has(transaction.id) && !this.isDuplicateTransaction(transaction, merged)) {
          merged.push(transaction)
          processedIds.add(transaction.id)
        }
      })

      // Sort by date (newest first)
      return merged.sort((a: Transaction, b: Transaction) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    },

    cleanupOrphanedOptimisticTransactions(): void {
      const beforeCount = this.transactions.length
      const twoMinutesAgo = Date.now() - (2 * 60 * 1000)

      this.transactions = this.transactions.filter((t: Transaction) => {
        if (t.id.toString().startsWith('temp_')) {
          const transactionTime = new Date(t.date).getTime()
          if (transactionTime < twoMinutesAgo) {
            this.pendingTransactions.delete(t.id)
            console.log(`🧹 Cleaned up old optimistic: ${t.id}`)
            return false
          }
        }
        return true
      })

      const cleanedCount = beforeCount - this.transactions.length
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} orphaned transactions`)
      }
    },

    clearError(): void {
      this.error = null
    },

    resetStore(): void {
      this.wallet = null
      this.transactions = []
      this.accountSummary = null
      this.loading = false
      this.error = null
      this.dataSource = { wallet: null, transactions: null }
      this.transactionPagination = {
        currentPage: 1,
        pageSize: 20,
        totalCount: 0,
        hasMore: true,
        isLoadingMore: false
      }
      this.lastSyncTimestamp = null
      this.pendingTransactions.clear()
    },

    // ========================================
    // DEBUG METHODS
    // ========================================

    logTransactionState(context: string = ''): void {
      const tempTransactions = this.transactions.filter(t => t.id.toString().startsWith('temp_'))
      const confirmedTransactions = this.transactions.filter(t => !t.id.toString().startsWith('temp_'))

      console.group(`📊 Transaction State ${context}`)
      console.log(`Total: ${this.transactions.length} | Temp: ${tempTransactions.length} | Confirmed: ${confirmedTransactions.length}`)
      console.log(`Pending set size: ${this.pendingTransactions.size}`)

      if (tempTransactions.length > 0) {
        console.table(tempTransactions.map(t => ({
          id: t.id.substring(0, 20) + '...',
          type: t.type,
          amount: t.amount,
          status: t.status
        })))
      }
      console.groupEnd()
    },

    logTempTransactions(): void {
      const tempTransactions = this.transactions.filter(t => t.id.toString().startsWith('temp_'))
      console.log(`Current temp transactions:`, tempTransactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount
      })))
    },

    forceCleanupTempTransactions(): void {
      const beforeCount = this.transactions.length
      this.transactions = this.transactions.filter(t => !t.id.toString().startsWith('temp_'))
      this.pendingTransactions.clear()

      const removedCount = beforeCount - this.transactions.length
      console.log(`🧹 Force cleaned ${removedCount} temp transactions`)
      this.logTransactionState('after force cleanup')
    }
  }
})
