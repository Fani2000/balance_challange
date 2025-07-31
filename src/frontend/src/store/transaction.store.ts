import { defineStore } from 'pinia'
import { transactionService } from '../services/index'
import {type Transaction,} from '../types/services'

interface TransactionState {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  filter: 'all' | 'deposit' | 'withdrawal'
  sortBy: 'date' | 'amount'
  sortOrder: 'asc' | 'desc'
}

export const useTransactionStore = defineStore('transaction', {
  state: (): TransactionState => ({
    transactions: [],
    loading: false,
    error: null,
    filter: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  }),

  getters: {
    filteredTransactions: (state): Transaction[] => {
      let filtered = state.transactions

      // Apply filter
      if (state.filter !== 'all') {
        filtered = filtered.filter(t => t.type === state.filter)
      }

      // Apply sort
      filtered.sort((a, b) => {
        let comparison = 0

        if (state.sortBy === 'date') {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        } else if (state.sortBy === 'amount') {
          comparison = a.amount - b.amount
        }

        return state.sortOrder === 'desc' ? -comparison : comparison
      })

      return filtered
    },

    isEmpty: (state): boolean => {
      return state.transactions.length === 0
    },

    hasFailedTransactions: (state): boolean => {
      return state.transactions.some(t => t.status === 'failed')
    }
  },

  actions: {
    async fetchTransactions() {
      this.loading = true
      this.error = null

      try {
        const response = await transactionService.getTransactions()
        console.log("transactions: ", response)
        this.transactions = response.transactions
      } catch (error: any) {
        this.error = error.message || 'Failed to load transactions'
        console.error('Transaction fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    // Add new transaction (for deposit simulation)
    addTransaction(transaction: Omit<Transaction, 'id' | 'date'>) {
      const newTransaction: Transaction = {
        ...transaction,
        id: `txn_${Date.now()}`,
        date: new Date().toISOString()
      }
      this.transactions.unshift(newTransaction)
    },

    setFilter(filter: 'all' | 'deposit' | 'withdrawal') {
      this.filter = filter
    },

    setSorting(sortBy: 'date' | 'amount', sortOrder: 'asc' | 'desc') {
      this.sortBy = sortBy
      this.sortOrder = sortOrder
    },

    clearError() {
      this.error = null
    }
  }
})
