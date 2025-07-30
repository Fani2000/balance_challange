<template>
  <div>
    <!-- Empty State -->
    <div v-if="!loading && transactions.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-receipt-text-outline</v-icon>
      <h3 class="text-h6 text-grey-darken-1 mb-2">No transactions yet</h3>
      <p class="text-body-2 text-grey">Your transaction history will appear here</p>
      <v-btn 
        color="primary" 
        variant="text" 
        @click="$emit('refresh')"
        class="mt-4"
      >
        <v-icon start>mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>

    <!-- Transaction List -->
    <v-list v-else class="pa-0">
      <!-- Loading Skeletons -->
      <template v-if="loading">
        <v-list-item v-for="n in 5" :key="n" class="px-6 py-4">
          <template #prepend>
            <v-skeleton-loader type="avatar" class="mr-4"></v-skeleton-loader>
          </template>
          <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
          <template #append>
            <v-skeleton-loader type="text" width="80"></v-skeleton-loader>
          </template>
        </v-list-item>
      </template>

      <!-- Actual Transactions -->
      <template v-else>
        <v-list-item
          v-for="(transaction, index) in transactions"
          :key="transaction.id"
          class="transaction-item px-6 py-4"
          :class="{ 'border-b': index < transactions.length - 1 }"
        >
          <template #prepend>
            <v-avatar 
              :color="getTransactionColor(transaction.type, transaction.status)" 
              class="mr-4"
              size="40"
            >
              <v-icon color="white" size="20">
                {{ getTransactionIcon(transaction.type) }}
              </v-icon>
            </v-avatar>
          </template>
          
          <v-list-item-title class="font-weight-medium">
            {{ getTransactionTitle(transaction) }}
          </v-list-item-title>
          
          <v-list-item-subtitle class="d-flex align-center mt-1">
            <span class="mr-2">{{ formatDate(transaction.date) }}</span>
            <v-chip 
              :color="getStatusColor(transaction.status)"
              variant="flat"
              size="x-small"
              class="text-caption"
            >
              {{ transaction.status.toUpperCase() }}
            </v-chip>
          </v-list-item-subtitle>

          <template #append>
            <div class="text-right">
              <div 
                class="text-h6 font-weight-bold"
                :class="getAmountColor(transaction.type)"
              >
                {{ formatAmount(transaction.amount, transaction.type) }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ transaction.currency }}
              </div>
            </div>
          </template>
        </v-list-item>
      </template>
    </v-list>

    <!-- Load More Button -->
    <div v-if="!loading && transactions.length > 0" class="text-center pa-4">
      <v-btn 
        variant="outlined" 
        color="primary"
        @click="$emit('loadMore')"
        :loading="loading"
      >
        Load More Transactions
      </v-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({
  transactions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['refresh', 'loadMore'])

const getTransactionIcon = (type) => {
  const icons = {
    deposit: 'mdi-arrow-down',
    withdrawal: 'mdi-arrow-up',
    transfer: 'mdi-swap-horizontal'
  }
  return icons[type] || 'mdi-swap-horizontal'
}

const getTransactionColor = (type, status) => {
  if (status === 'failed') return 'error'
  const colors = {
    deposit: 'success',
    withdrawal: 'warning',
    transfer: 'info'
  }
  return colors[type] || 'grey'
}

const getTransactionTitle = (transaction) => {
  const titles = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    transfer: 'Transfer'
  }
  return transaction.description || titles[transaction.type] || 'Transaction'
}

const getStatusColor = (status) => {
  const colors = {
    success: 'success',
    failed: 'error',
    pending: 'warning'
  }
  return colors[status] || 'grey'
}

const getAmountColor = (type) => {
  return type === 'deposit' ? 'text-success' : 'text-error'
}

const formatAmount = (amount, type) => {
  const prefix = type === 'deposit' ? '+' : '-'
  return `${prefix}R${amount.toLocaleString()}`
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
</script>

<style scoped>
.transaction-item {
  transition: background-color 0.2s ease;
}

.transaction-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
