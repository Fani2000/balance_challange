import { defineStore } from 'pinia'

interface UIState {
  showDepositModal: boolean
  showWithdrawModal: boolean
  isInitialLoading: boolean
  notification: {
    show: boolean
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    showDepositModal: false,
    showWithdrawModal: false,
    isInitialLoading: true,
    notification: {
      show: false,
      message: '',
      type: 'info'
    }
  }),

  actions: {
    openDepositModal() {
      this.showDepositModal = true
    },

    closeDepositModal() {
      this.showDepositModal = false
    },

    openWithdrawModal() {
      this.showWithdrawModal = true
    },

    closeWithdrawModal() {
      this.showWithdrawModal = false
    },

    setInitialLoading(loading: boolean) {
      this.isInitialLoading = loading
    },

    showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
      this.notification = {
        show: true,
        message,
        type
      }

      // Auto-hide after 5 seconds
      setTimeout(() => {
        this.hideNotification()
      }, 5000)
    },

    hideNotification() {
      this.notification.show = false
    }
  }
})
