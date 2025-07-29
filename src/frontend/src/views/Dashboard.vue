<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <!-- Header -->
    <v-app-bar
      color="white"
      elevation="0"
      class="border-b"
      style="backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.9);"
    >
      <template #prepend>
        <div class="d-flex align-center ml-4">
          <div class="bonmoja-logo">
            <v-avatar size="32" class="bg-gradient-to-r from-blue-600 to-indigo-600 mr-3">
              <span class="text-white font-weight-bold">B</span>
            </v-avatar>
            <span class="text-h6 font-weight-bold text-grey-darken-3">Bonmoja Wallet</span>
          </div>
        </div>
      </template>

      <v-spacer></v-spacer>

      <template #append>
        <div class="d-flex align-center mr-4">
          <v-chip variant="outlined" size="small" class="mr-3">ZAR</v-chip>
          <v-btn icon size="small">
            <v-avatar size="32" class="bg-grey-lighten-2">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
          </v-btn>
        </div>
      </template>
    </v-app-bar>

    <v-main class="pt-4">
      <v-container fluid class="pa-4 pa-md-6">
        <!-- Loading State -->
        <div v-if="loading.wallet || loading.transactions" class="mb-6">
          <WalletBalanceSkeleton />
          <TransactionListSkeleton class="mt-6" />
        </div>

        <!-- Error State -->
        <ErrorMessage
          v-else-if="error"
          :message="error"
          @retry="fetchWalletData"
        />

        <!-- Main Content -->
        <div v-else>
          <!-- Wallet Balance Card -->
          <WalletBalanceCard
            :balance="walletBalance"
            :currency="'ZAR'"
            :loading="loading.wallet"
            @deposit="openDepositModal"
            @withdraw="openWithdrawModal"
            class="mb-6"
          />

          <!-- Quick Actions -->
          <v-row class="mb-6">
            <v-col cols="6" sm="3">
              <QuickActionCard
                icon="mdi-plus"
                title="Deposit"
                subtitle="Add funds"
                color="success"
                @click="openDepositModal"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <QuickActionCard
                icon="mdi-minus"
                title="Withdraw"
                subtitle="Cash out"
                color="warning"
                @click="openWithdrawModal"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <QuickActionCard
                icon="mdi-history"
                title="History"
                subtitle="View all"
                color="info"
                @click="scrollToTransactions"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <QuickActionCard
                icon="mdi-help-circle"
                title="Support"
                subtitle="Get help"
                color="primary"
                @click="openSupport"
              />
            </v-col>
          </v-row>

          <!-- Transactions Section -->
          <v-card class="elevation-2" rounded="xl" id="transactions-section">
            <v-card-title class="pa-6 pb-3 d-flex justify-space-between align-center">
              <h3 class="text-h6 font-weight-bold">Recent Transactions</h3>
              <TransactionFilters
                v-model:filter="transactionFilter"
                v-model:sort="transactionSort"
              />
            </v-card-title>

            <TransactionList
              :transactions="filteredTransactions"
              :loading="loading.transactions"
              @refresh="fetchTransactions"
            />
          </v-card>
        </div>
      </v-container>
    </v-main>

    <!-- Deposit Modal -->
    <DepositModal
      v-model="showDepositModal"
      @success="handleDepositSuccess"
    />

    <!-- Withdraw Modal -->
    <WithdrawModal
      v-model="showWithdrawModal"
      @success="handleWithdrawSuccess"
    />

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="5000"
      location="top right"
      class="ma-4"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-3">{{ snackbar.icon }}</v-icon>
        {{ snackbar.message }}
      </div>
      <template #actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
          icon="mdi-close"
        />
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useBankingStore } from '../store/banking'

// Components
import WalletBalanceCard from '../components/WalletBalanceCard.vue'
import WalletBalanceSkeleton from '../components/WalletBalanceSkeleton.vue'
import TransactionList from '../components/TransactionList.vue'
import TransactionListSkeleton from '../components/TransactionListSkeleton.vue'
import TransactionFilters from '../components/TransactionFilters.vue'
import QuickActionCard from '../components/QuickActionCard.vue'
import DepositModal from '../components/DepositModal.vue'
import WithdrawModal from '../components/WithdrawModal.vue'
import ErrorMessage from '../components/ErrorMessage.vue'

const store = useBankingStore()

// State
const walletBalance = ref(7250.50) // From mock API
const transactions = ref([])
const error = ref(null)
const showDepositModal = ref(false)
const showWithdrawModal = ref(false)
const transactionFilter = ref('all')
const transactionSort = ref('date-desc')

const loading = reactive({
  wallet: false,
  transactions: false
})

const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
  icon: 'mdi-check-circle'
})

// Computed
const filteredTransactions = computed(() => {
  let filtered = [...transactions.value]

  // Apply filter
  if (transactionFilter.value !== 'all') {
    filtered = filtered.filter(t => t.type === transactionFilter.value)
  }

  // Apply sort
  switch (transactionSort.value) {
    case 'date-desc':
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
      break
    case 'date-asc':
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
      break
    case 'amount-desc':
      filtered.sort((a, b) => b.amount - a.amount)
      break
    case 'amount-asc':
      filtered.sort((a, b) => a.amount - b.amount)
      break
  }

  return filtered
})

// Methods
const fetchWalletData = async () => {
  await Promise.all([
    fetchWalletBalance(),
    fetchTransactions()
  ])
}

const fetchWalletBalance = async () => {
  loading.wallet = true
  try {
    // Try mock API first, fallback to backend
    try {
      const response = await fetch('/api/wallet.json')
      if (response.ok) {
        const data = await response.json()
        walletBalance.value = data.balance
        return
      }
    } catch (mockError) {
      console.log('Mock API not available, using backend')
    }

    // Fallback to backend API
    const account = await store.fetchAccount()
    if (account) {
      walletBalance.value = account.balance
    }
  } catch (err) {
    error.value = 'Failed to load wallet balance'
    console.error('Error fetching wallet:', err)
  } finally {
    loading.wallet = false
  }
}

const fetchTransactions = async () => {
  loading.transactions = true
  try {
    // Try mock API first, fallback to backend
    try {
      const response = await fetch('/api/transactions.json')
      if (response.ok) {
        const data = await response.json()
        transactions.value = data
        return
      }
    } catch (mockError) {
      console.log('Mock API not available, using backend')
    }

    // Fallback to backend API
    const backendTransactions = await store.fetchTransactions()
    if (backendTransactions) {
      // Convert backend format to match mock API format
      transactions.value = backendTransactions.map(t => ({
        id: t.id.toString(),
        type: t.type.toLowerCase().replace('_', ''),
        amount: Math.abs(t.amount),
        currency: 'ZAR',
        status: 'success',
        date: t.createdAt,
        description: t.description
      }))
    }
  } catch (err) {
    error.value = 'Failed to load transactions'
    console.error('Error fetching transactions:', err)
  } finally {
    loading.transactions = false
  }
}

const openDepositModal = () => {
  showDepositModal.value = true
}

const openWithdrawModal = () => {
  showWithdrawModal.value = true
}

const openSupport = () => {
  // Placeholder for support functionality
  showNotification('Support chat will be available soon!', 'info', 'mdi-information')
}

const scrollToTransactions = () => {
  const element = document.getElementById('transactions-section')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleDepositSuccess = (amount, paymentMethod) => {
  // Update wallet balance optimistically
  walletBalance.value += amount

  // Add new transaction
  const newTransaction = {
    id: `txn_${Date.now()}`,
    type: 'deposit',
    amount: amount,
    currency: 'ZAR',
    status: 'success',
    date: new Date().toISOString(),
    description: `Deposit via ${paymentMethod}`
  }

  transactions.value.unshift(newTransaction)

  showNotification(
    `Successfully deposited R${amount.toLocaleString()}`,
    'success',
    'mdi-check-circle'
  )
}

const handleWithdrawSuccess = (amount, method) => {
  // Update wallet balance optimistically
  walletBalance.value -= amount

  // Add new transaction
  const newTransaction = {
    id: `txn_${Date.now()}`,
    type: 'withdrawal',
    amount: amount,
    currency: 'ZAR',
    status: 'success',
    date: new Date().toISOString(),
    description: `Withdrawal to ${method}`
  }

  transactions.value.unshift(newTransaction)

  showNotification(
    `Successfully withdrew R${amount.toLocaleString()}`,
    'success',
    'mdi-check-circle'
  )
}

const showNotification = (message, color = 'success', icon = 'mdi-check-circle') => {
  snackbar.message = message
  snackbar.color = color
  snackbar.icon = icon
  snackbar.show = true
}

// Lifecycle
onMounted(() => {
  fetchWalletData()
})
</script>

<style scoped>
.min-height-screen {
  min-height: 100vh;
}

.gap-3 {
  gap: 12px;
}
</style>
