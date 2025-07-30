<template>
  <v-card
    class="wallet-balance-card elevation-8"
    rounded="xl"
    :class="{ 'loading': loading }"
  >
    <div class="wallet-gradient pa-6 pa-md-8 text-white position-relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="wallet-pattern"></div>

      <div class="d-flex flex-column flex-md-row justify-space-between align-start position-relative">
        <div class="flex-grow-1 mb-4 mb-md-0">
          <p class="text-subtitle-2 opacity-90 mb-2">Wallet Balance</p>
          <div class="d-flex align-baseline mb-2">
            <span class="text-h3 text-md-h2 font-weight-bold mr-2">
              {{ formatCurrency(balance) }}
            </span>
            <span class="text-h6 opacity-80">{{ currency }}</span>
          </div>
          <p class="text-caption opacity-75">Available for gaming</p>
        </div>

        <div class="d-flex flex-column flex-sm-row ga-3">
          <v-btn
            @click="$emit('deposit')"
            color="white"
            variant="elevated"
            size="large"
            rounded="xl"
            class="text-primary font-weight-bold px-6"
            :loading="loading"
          >
            <template #prepend>
              <v-icon>mdi-plus</v-icon>
            </template>
            Deposit
          </v-btn>

          <v-btn
            @click="$emit('withdraw')"
            variant="outlined"
            size="large"
            rounded="xl"
            color="white"
            class="font-weight-bold px-6 border-opacity-50"
            :loading="loading"
          >
            <template #prepend>
              <v-icon>mdi-minus</v-icon>
            </template>
            Withdraw
          </v-btn>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="d-flex justify-space-between mt-6 pt-4 border-t border-opacity-25">
        <div class="text-center">
          <v-icon color="green-lighten-2" class="mb-1">mdi-trending-up</v-icon>
          <p class="text-caption opacity-80">+12.5% this month</p>
        </div>
        <div class="text-center">
          <v-icon color="blue-lighten-2" class="mb-1">mdi-shield-check</v-icon>
          <p class="text-caption opacity-80">Secure & Protected</p>
        </div>
        <div class="text-center">
          <v-icon color="yellow-lighten-2" class="mb-1">mdi-lightning-bolt</v-icon>
          <p class="text-caption opacity-80">Instant Transfers</p>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'ZAR'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['deposit', 'withdraw'])

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }).format(amount).replace('ZAR', 'R')
}
</script>

<style scoped>
.wallet-balance-card {
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.wallet-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

.wallet-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 2px, transparent 2px);
  background-size: 50px 50px;
  opacity: 0.5;
}

.loading {
  opacity: 0.7;
}

@media (max-width: 600px) {
  .wallet-gradient {
    padding: 24px 20px;
  }
}
</style>
