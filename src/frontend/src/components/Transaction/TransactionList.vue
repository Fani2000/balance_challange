<template>
  <div>
    <!-- Empty State -->
    <div v-if="!loading && transactions.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-receipt-text-outline</v-icon>
      <h3 class="text-h6 text-grey-darken-1 mb-2">{{ $t('transactions.empty.title') }}</h3>
      <p class="text-body-2 text-grey">{{ $t('transactions.empty.subtitle') }}</p>
      <v-btn
        color="primary"
        variant="text"
        @click="$emit('refresh')"
        class="mt-4"
      >
        <v-icon start>mdi-refresh</v-icon>
        {{ $t('transactions.empty.refresh') }}
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
          :class="{
            'border-b': index < transactions.length - 1,
            'new-item': index >= prevTransactionCount
          }"
          ref="transactionItems"
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
            {{ $t(`transactions.types.${transaction.type}`) }}
          </v-list-item-title>

          <v-list-item-subtitle class="d-flex align-center mt-1">
            <span class="mr-2">{{ formatDate(transaction.date) }}</span>
            <v-chip
              :color="getStatusColor(transaction.status)"
              variant="flat"
              size="x-small"
              class="text-caption"
            >
              {{ transaction.status }}
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
        {{ $t('transactions.loadMore') }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { gsap } from 'gsap';
import { ref, watch, nextTick, onMounted } from 'vue';

const { t } = useI18n();

const props = defineProps({
  transactions: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

defineEmits(['refresh', 'loadMore']);

// Keep track of previous transaction count to detect new additions
const prevTransactionCount = ref(0);
const transactionItems = ref([]);

// Initialize GSAP animation on mount
onMounted(() => {
  // If there are transactions on initial load, animate all of them
  if (!props.loading && props.transactions.length > 0) {
    nextTick(() => {
      const items = document.querySelectorAll('.transaction-item');
      animateItems(items);
      prevTransactionCount.value = props.transactions.length;
    });
  }
});

// Watch for changes in transactions to animate new ones
watch(() => props.transactions, async (newTransactions, oldTransactions) => {
  // Skip if loading or if there are no transactions
  if (props.loading || !newTransactions.length) return;

  // If initial load or completely different set of transactions
  if (prevTransactionCount.value === 0 || oldTransactions.length === 0) {
    await nextTick();
    const items = document.querySelectorAll('.transaction-item');
    animateItems(items);
  }
  // Only animate if new transactions were added
  else if (newTransactions.length > prevTransactionCount.value) {
    await nextTick();

    // Target only newly added transactions
    const newItems = document.querySelectorAll('.transaction-item.new-item');
    animateItems(newItems);
  }

  prevTransactionCount.value = newTransactions.length;
}, { deep: true });

const animateItems = (items) => {
  // Set initial state before animation
  gsap.set(items, {
    opacity: 0,
    y: 20,
    scale: 0.95
  });

  // Animate the items
  gsap.to(items, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.5,
    stagger: 0.08,
    ease: "back.out(1.7)",
    onComplete: () => {
      // Remove the 'new-item' class after animation
      Array.from(items).forEach(item => {
        item.classList.remove('new-item');
      });
    }
  });
};

const getTransactionIcon = (type) => {
  const icons = {
    deposit: 'mdi-arrow-down',
    withdrawal: 'mdi-arrow-up',
    transfer: 'mdi-swap-horizontal'
  };
  return icons[type] || 'mdi-swap-horizontal';
};

const getTransactionColor = (type, status) => {
  if (status === 'failed') return 'error';
  const colors = {
    deposit: 'success',
    withdrawal: 'warning',
    transfer: 'info'
  };
  return colors[type] || 'grey';
};

const getStatusColor = (status) => {
  const colors = {
    success: 'success',
    pending: 'warning',
    failed: 'error'
  };
  return colors[status] || 'grey';
};

const getAmountColor = (type) => {
  return {
    'text-success': type === 'deposit',
    'text-error': type === 'withdrawal',
    'text-info': type === 'transfer'
  };
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const formatAmount = (amount, type) => {
  const prefix = type === 'deposit' ? '+' : type === 'withdrawal' ? '-' : '';
  return `${prefix}${amount.toFixed(2)}`;
};
</script>

<style scoped>
.transaction-item {
  transform-origin: center;
  will-change: transform, opacity;
  transition: background-color 0.2s ease;
}

.transaction-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.new-item {
  position: relative;
}
</style>
