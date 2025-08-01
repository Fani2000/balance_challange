import {defineStore} from 'pinia'
import {walletService} from '../services/index'
import {type WalletBalance} from '../types/services'


export const useWalletStore = defineStore('wallet', {
  state: (): WalletBalance => ({
    balance: 0,
    currency: 'ZAR',
    loading: false,
    error: null
  }),

  getters: {
    formattedBalance: (state): string => {
      return `${state.currency} ${state.balance.toLocaleString()}`
    }
  },

  actions: {
    async fetchWallet() {
      this.loading = true
      this.error = null

      try {
        const data = await walletService.getWalletBalance()
        this.balance = data.balance
        this.currency = data.currency
      } catch (error: any) {
        this.error = error.message || 'Failed to load wallet'
        console.error('Wallet fetch error:', error)
      } finally {
        this.loading = false
      }
    },

    async addDeposit(amount: number, paymentMethod?: string) {
      this.balance += amount
      if(paymentMethod !== undefined) {
        await walletService.deposit(amount, paymentMethod!)
      }
    },

    async withdraw(amount: number, paymentMethod?: string) {
      this.balance -= amount
      if(paymentMethod !== undefined){
        await walletService.withdraw( amount, paymentMethod!)
      }
    },

    clearError() {
      this.error = null
    }
  }
})
