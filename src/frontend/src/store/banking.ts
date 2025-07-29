import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:5000'

export const useBankingStore = defineStore('banking', {
  state: () => ({
    wallet: null,
    transactions: [],
    loading: false,
    error: null
  }),

  getters: {
    walletBalance: (state) => state.wallet?.balance || 0,
    walletCurrency: (state) => state.wallet?.currency || 'ZAR',
    recentTransactions: (state) => state.transactions.slice(0, 10),
    totalDeposits: (state) => {
      return state.transactions
        .filter(t => t.type === 'deposit' && t.status === 'success')
        .reduce((sum, t) => sum + t.amount, 0)
    },
    totalWithdrawals: (state) => {
      return state.transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'success')
        .reduce((sum, t) => sum + t.amount, 0)
    }
  },

  actions: {
    async fetchWallet() {
      this.loading = true
      try {
        // Try mock API first
        try {
          const response = await fetch('/api/wallet.json')
          if (response.ok) {
            this.wallet = await response.json()
            return this.wallet
          }
        } catch (mockError) {
          console.log('Mock API not available, trying backend...')
        }

        // Fallback to backend API
        const response = await axios.get(`${API_BASE_URL}/account`)
        this.wallet = {
          balance: response.data.balance,
          currency: 'ZAR'
        }
        return this.wallet
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchTransactions() {
      this.loading = true
      try {
        // Try mock API first
        try {
          const response = await fetch('/api/transactions.json')
          if (response.ok) {
            this.transactions = await response.json()
            return this.transactions
          }
        } catch (mockError) {
          console.log('Mock API not available, trying backend...')
        }

        // Fallback to backend API
        const response = await axios.get(`${API_BASE_URL}/transactions`)
        this.transactions = response.data.map(t => ({
          id: t.id.toString(),
          type: t.type.toLowerCase().replace('_', ''),
          amount: Math.abs(t.amount),
          currency: 'ZAR',
          status: 'success',
          date: t.createdAt,
          description: t.description
        }))
        return this.transactions
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchAccount() {
      this.loading = true
      try {
        const response = await axios.get(`${API_BASE_URL}/account`)
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deposit(amount, paymentMethod) {
      this.loading = true
      try {
        // For demo purposes, simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Update wallet balance optimistically
        if (this.wallet) {
          this.wallet.balance += amount
        }

        // Add transaction
        const newTransaction = {
          id: `txn_${Date.now()}`,
          type: 'deposit',
          amount: amount,
          currency: 'ZAR',
          status: 'success',
          date: new Date().toISOString(),
          description: `Deposit via ${paymentMethod}`
        }

        this.transactions.unshift(newTransaction)
        return newTransaction
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async withdraw(amount, method) {
      this.loading = true
      try {
        // For demo purposes, simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Update wallet balance optimistically
        if (this.wallet && this.wallet.balance >= amount) {
          this.wallet.balance -= amount
        } else {
          throw new Error('Insufficient funds')
        }

        // Add transaction
        const newTransaction = {
          id: `txn_${Date.now()}`,
          type: 'withdrawal',
          amount: amount,
          currency: 'ZAR',
          status: 'success',
          date: new Date().toISOString(),
          description: `Withdrawal to ${method}`
        }

        this.transactions.unshift(newTransaction)
        return newTransaction
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Legacy methods for backward compatibility with backend
    async transferMoney(recipient, amount) {
      this.loading = true
      try {
        const response = await axios.post(`${API_BASE_URL}/account/transfer`, {
          recipient,
          amount
        })
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async requestLoan(amount) {
      this.loading = true
      try {
        const response = await axios.post(`${API_BASE_URL}/account/loan`, {
          amount
        })
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    }
  }
})
