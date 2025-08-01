<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" style="zoom: 75%">
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
          <v-chip variant="outlined" size="small" class="mr-3">{{ currency }}</v-chip>
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
          @retry="fetchWallet"
        />

        <!-- Main Content -->
        <div v-else>
          <!-- Wallet Balance Card -->
          <WalletBalanceCard
            :balance="balance"
            :currency="currency"
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
              @load-more="fetchTransactions"
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
import { ref, computed, onMounted } from 'vue'
import { useWalletStore } from '../store/wallet.store'
import { useTransactionStore } from '../store/transaction.store'
import { useUIStore } from '../store/global.ui.store'
import { storeToRefs } from 'pinia'

// Components
import WalletBalanceCard from '../components/Wallet/WalletBalanceCard.vue'
import WalletBalanceSkeleton from '../components/Wallet/WalletBalanceSkeleton.vue'
import TransactionList from '../components/Transaction/TransactionList.vue'
import TransactionListSkeleton from '../components/Transaction/TransactionListSkeleton.vue'
import TransactionFilters from '../components/Transaction/TransactionFilters.vue'
import QuickActionCard from '../components/QuickActionCard.vue'
import DepositModal from '../components/Modals/DepositModal.vue'
import WithdrawModal from '../components/Modals/WithdrawModal.vue'
import ErrorMessage from '../components/ErrorMessage.vue'

// Store
const { fetchWallet, addDeposit, withdraw } = useWalletStore()
const { fetchTransactions } = useTransactionStore()
const { transactions, loading: transactionLoading } = storeToRefs(useTransactionStore())
const { balance, currency, loading:walletLoading, error:walletError } = storeToRefs(useWalletStore())
const {showDepositModal, showWithdrawModal} = storeToRefs(useUIStore())
const {openDepositModal, openWithdrawModal} = useUIStore()

// Local state
const transactionFilter = ref('all')
const transactionSort = ref('date-desc')

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  icon: 'mdi-check-circle'
})

// Computed properties from store
const loading = computed(() => ({
  wallet: walletLoading.value,
  transactions: transactionLoading.value
}))
const error = computed(() => walletError.value)
// const dataSource = computed(() => store.dataSource)

// Computed
const filteredTransactions = computed(() => {
  console.log("Transactions: ", transactions.value)
  let filtered = transactions.value

  // Apply filter
  if (transactionFilter.value !== 'all') {
    filtered = filtered.filter(t => t.type === transactionFilter.value)
  }

  console.log("Transactions: ", filtered)

  // Apply sort
  switch (transactionSort.value) {
    case 'date-desc':
      filtered?.sort((a, b) => new Date(b.date) - new Date(a.date))
      break
    case 'date-asc':
      filtered?.sort((a, b) => new Date(a.date) - new Date(b.date))
      break
    case 'amount-desc':
      filtered?.sort((a, b) => b.amount - a.amount)
      break
    case 'amount-asc':
      filtered?.sort((a, b) => a.amount - b.amount)
      break
  }

  return filtered
})


const openSupport = () => {
  showNotification('Support chat will be available soon!', 'info', 'mdi-information')
}

const scrollToTransactions = () => {
  const element = document.getElementById('transactions-section')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleDepositSuccess = async (amount, paymentMethod) => {
  try {
    await addDeposit(amount, paymentMethod)

    await fetchTransactions()

    showNotification(
      `Successfully deposited ${currency.value}${amount.toLocaleString()}`,
      'success',
      'mdi-check-circle'
    )
  } catch (error) {
    showNotification(
      `Deposit failed: ${error.message}`,
      'error',
      'mdi-alert-circle'
    )
  }
}

const handleWithdrawSuccess = async (amount, method) => {
  try {
    await withdraw(amount, method)

    await fetchTransactions()

    showNotification(
      `Successfully withdrew ${currency.value}${amount.toLocaleString()}`,
      'success',
      'mdi-check-circle'
    )
  } catch (error) {
    showNotification(
      `Withdrawal failed: ${error.message}`,
      'error',
      'mdi-alert-circle'
    )
  }
}

const showNotification = (message, color = 'success', icon = 'mdi-check-circle') => {
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.icon = icon
  snackbar.value.show = true
}

// Lifecycle
onMounted(() => {
  fetchWallet()
  fetchTransactions()
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
