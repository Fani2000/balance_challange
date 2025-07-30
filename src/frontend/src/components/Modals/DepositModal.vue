<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <v-card rounded="xl" class="elevation-12">
      <v-card-title class="pa-6 pb-4">
        <div class="d-flex align-center">
          <v-avatar color="success" class="mr-3" size="40">
            <v-icon color="white">mdi-plus</v-icon>
          </v-avatar>
          <div>
            <h2 class="text-h5 font-weight-bold">Deposit Funds</h2>
            <p class="text-caption text-medium-emphasis ma-0">Add money to your wallet</p>
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
            min="10"
            max="50000"
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
          <div class="mb-6">
            <p class="text-subtitle-2 mb-3">Quick amounts:</p>
            <div class="d-flex flex-wrap ga-2">
              <v-btn
                v-for="quickAmount in quickAmounts"
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

          <!-- Payment Method -->
          <v-select
            v-model="paymentMethod"
            label="Payment Method"
            :items="paymentMethods"
            item-title="label"
            item-value="value"
            variant="outlined"
            :rules="[v => !!v || 'Payment method is required']"
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
              </v-list-item>
            </template>
          </v-select>

          <!-- Current Balance Display -->
          <v-alert
            color="info"
            variant="tonal"
            class="mb-4"
          >
            <template #prepend>
              <v-icon>mdi-wallet</v-icon>
            </template>
            <div class="text-caption">
              Current balance: <strong>R{{ store.walletBalance.toLocaleString() }}</strong>
            </div>
          </v-alert>

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

          <!-- Security Notice -->
          <v-alert
            color="info"
            variant="tonal"
            class="mb-4"
          >
            <template #prepend>
              <v-icon>mdi-shield-check</v-icon>
            </template>
            <div class="text-caption">
              Your payment is secured with 256-bit SSL encryption.
              Deposits are processed instantly.
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
          color="success"
          variant="elevated"
          @click="handleSubmit"
          :loading="loading"
          :disabled="!valid || !amount || !paymentMethod"
          class="px-6"
        >
          <v-icon start>mdi-credit-card</v-icon>
          Deposit R{{ amount || '0' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBankingStore } from '../../store/banking'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'success'])

// Store
const store = useBankingStore()

// Form state
const form = ref(null)
const valid = ref(false)
const amount = ref('')
const paymentMethod = ref('')
const loading = ref(false)
const error = ref(null)

// Configuration
const quickAmounts = [100, 500, 1000, 2500, 5000]

const paymentMethods = [
  { value: 'Credit Card', label: 'Credit/Debit Card', icon: 'mdi-credit-card' },
  { value: 'Instant EFT', label: 'Instant EFT', icon: 'mdi-bank' },
  { value: 'E-Wallet', label: 'E-Wallet', icon: 'mdi-wallet' },
  { value: 'Cryptocurrency', label: 'Cryptocurrency', icon: 'mdi-bitcoin' }
]

// Validation rules
const amountRules = [
  v => !!v || 'Amount is required',
  v => v >= 10 || 'Minimum deposit is R10',
  v => v <= 50000 || 'Maximum deposit is R50,000',
  v => /^\d+(\.\d{1,2})?$/.test(v) || 'Invalid amount format'
]

// Methods
const handleSubmit = async () => {
  // Clear previous errors
  error.value = null

  // Validate form
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return

  loading.value = true

  try {
    // Use store deposit method which calls the API
    await store.deposit(parseFloat(amount.value), paymentMethod.value)

    // Emit success event to parent component
    emit('success', parseFloat(amount.value), paymentMethod.value)

    // Close modal
    emit('update:modelValue', false)

    // Reset form
    resetForm()

  } catch (err) {
    error.value = err.message || 'Deposit failed. Please try again.'
    console.error('Deposit failed:', err)
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
  paymentMethod.value = ''
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
  }
})

// Watch for store errors
watch(() => store.error, (newError) => {
  if (newError && newError.includes('Deposit')) {
    error.value = newError
  }
})
</script>

<style scoped>
.bonmoja-logo {
  display: flex;
  align-items: center;
}

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
