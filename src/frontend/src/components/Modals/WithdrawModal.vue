<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <v-card rounded="xl" class="elevation-12" style="zoom: 75%">
      <v-card-title class="pa-6 pb-4">
        <div class="d-flex align-center">
          <v-avatar color="warning" class="mr-3" size="40">
            <v-icon color="white">mdi-minus</v-icon>
          </v-avatar>
          <div>
            <h2 class="text-h5 font-weight-bold">Withdraw Funds</h2>
            <p class="text-caption text-medium-emphasis ma-0">Cash out from your wallet</p>
          </div>
        </div>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <!-- Amount Input -->
          <v-text-field
            v-model="amount"
            label="Amount"
            prefix="R"
            placeholder="0.00"
            variant="outlined"
            type="number"
            step="0.01"
            min="50"
            :max="availableBalance"
            :rules="amountRules"
            class="mb-4"
            autofocus
            :disabled="loading"
          >
            <template #append-inner>
              <span class="text-caption text-medium-emphasis">ZAR</span>
            </template>
          </v-text-field>

          <!-- Quick Amount Buttons -->
          <div class="mb-4" v-if="availableBalance > 0">
            <p class="text-subtitle-2 mb-3">Quick amounts:</p>
            <div class="d-flex flex-wrap ga-2">
              <v-btn
                v-for="quickAmount in availableQuickAmounts"
                :key="quickAmount"
                variant="outlined"
                size="small"
                @click="amount = quickAmount"
                class="text-none"
                :disabled="loading"
              >
                R{{ quickAmount }}
              </v-btn>
            </div>
          </div>

          <!-- Available Balance -->
          <v-alert
            :color="availableBalance > 0 ? 'info' : 'warning'"
            variant="tonal"
            class="mb-4"
          >
            <template #prepend>
              <v-icon>{{ availableBalance > 0 ? 'mdi-wallet' : 'mdi-alert' }}</v-icon>
            </template>
            <div class="text-caption">
              <strong>Available balance: R{{ availableBalance.toLocaleString() }}</strong>
              <br v-if="availableBalance <= 0">
              <span v-if="availableBalance <= 0" class="text-warning">
                Insufficient funds for withdrawal
              </span>
            </div>
          </v-alert>

          <!-- Withdrawal Method -->
          <v-select
            v-model="withdrawalMethod"
            label="Withdrawal Method"
            :items="withdrawalMethods"
            item-title="label"
            item-value="value"
            variant="outlined"
            :rules="[v => !!v || 'Withdrawal method is required']"
            class="mb-4"
            :disabled="loading"
          >
            <template #selection="{ item }">
              <div class="d-flex align-center">
                <v-icon :icon="item.raw.icon" class="mr-2"></v-icon>
                {{ item.raw.label }}
              </div>
            </template>

            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :icon="item.raw.icon"></v-icon>
                </template>
                <v-list-item-subtitle>
                  {{ item.raw.description }}
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>

          <!-- Error Display -->
          <v-alert
            v-if="error"
            color="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="error = null"
          >
            <template #prepend>
              <v-icon>mdi-alert-circle</v-icon>
            </template>
            {{ error }}
          </v-alert>

          <!-- Processing Time Notice -->
          <v-alert
            color="warning"
            variant="tonal"
            class="mb-4"
          >
            <template #prepend>
              <v-icon>mdi-clock-outline</v-icon>
            </template>
            <div class="text-caption">
              Withdrawals are processed within 24 hours.
              Additional verification may be required for large amounts.
            </div>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-spacer></v-spacer>
        <v-btn
          variant="outlined"
          @click="handleCancel"
          :disabled="loading"
        >
          Cancel
        </v-btn>
        <v-btn
          color="warning"
          variant="elevated"
          @click="handleSubmit"
          :loading="loading"
          :disabled="!valid || !amount || !withdrawalMethod || availableBalance <= 0"
          class="px-6"
        >
          <v-icon start>mdi-bank-transfer-out</v-icon>
          Withdraw R{{ amount || '0' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useWalletStore } from '../../store/wallet.store'
import { useTransactionStore } from '../../store/transaction.store'
import { useUIStore } from '../../store/global.ui.store'
import {storeToRefs} from 'pinia'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'success'])

// Store
const { balance, loading, error } = storeToRefs(useWalletStore())

// Form state
const form = ref(null)
const valid = ref(false)
const amount = ref('')
const withdrawalMethod = ref('')

// Computed
const availableBalance = computed(() => balance.value || 0)

const availableQuickAmounts = computed(() => {
  const quickAmounts = [100, 500, 1000, 2500, 5000]
  return quickAmounts.filter(amount => amount <= availableBalance.value)
})

// Configuration
const withdrawalMethods = [
  {
    value: 'Bank Account',
    label: 'Bank Account',
    icon: 'mdi-bank',
    description: 'Direct transfer to your bank account'
  },
  {
    value: 'E-Wallet',
    label: 'E-Wallet',
    icon: 'mdi-wallet',
    description: 'Transfer to your e-wallet'
  },
  {
    value: 'Debit Card',
    label: 'Debit Card',
    icon: 'mdi-credit-card',
    description: 'Instant transfer to your card'
  }
]

// Validation rules
const amountRules = computed(() => [
  v => !!v || 'Amount is required',
  v => v >= 50 || 'Minimum withdrawal is R50',
  v => v <= availableBalance.value || `Maximum withdrawal is R${availableBalance.value.toLocaleString()}`,
  v => /^\d+(\.\d{1,2})?$/.test(v) || 'Invalid amount format',
  v => availableBalance.value > 0 || 'Insufficient funds'
])

// Methods
const handleSubmit = async () => {
  // Clear previous errors
  error.value = null

  // Validate form
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return

  // Check sufficient funds
  if (parseFloat(amount.value) > availableBalance.value) {
    error.value = 'Insufficient funds for this withdrawal'
    return
  }

  loading.value = true

  try {
    // Emit success event to parent component
    emit('success', parseFloat(amount.value), withdrawalMethod.value)

    // Close modal
    emit('update:modelValue', false)

    // Reset form
    resetForm()

  } catch (err) {
    error.value = err.message || 'Withdrawal failed. Please try again.'
    console.error('Withdrawal failed:', err)
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  if (!loading.value) {
    resetForm()
    emit('update:modelValue', false)
  }
}

const resetForm = () => {
  amount.value = ''
  withdrawalMethod.value = ''
  error.value = null
  if (form.value) {
    form.value.reset()
  }
}

// Watch for modal close to reset form
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    // Reset form when modal closes
    setTimeout(resetForm, 300) // Delay to avoid visual glitch
  } else {
    // Refresh balance when modal opens
    if (balance.value === 0) {
      fetchWallet()
    }
  }
})

// Watch for store errors
watch(() => error, (newError) => {
  if (newError && newError.includes('Withdrawal')) {
    error.value = newError
  }
})
</script>

<style scoped>
/* Custom gradient backgrounds */
.bg-gradient-to-r {
  background: linear-gradient(to right, var(--v-theme-primary), var(--v-theme-secondary));
}

/* Mobile-first responsive adjustments */
@media (max-width: 600px) {
  .v-card-title {
    padding: 16px 16px 12px;
  }

  .v-card-text {
    padding: 16px;
  }

  .v-card-actions {
    padding: 16px;
    padding-top: 0;
  }
}

/* Custom hover effects */
.v-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  transition: transform 0.2s ease;
}
</style>
