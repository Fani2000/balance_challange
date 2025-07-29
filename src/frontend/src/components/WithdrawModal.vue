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
            :max="maxAmount"
            :rules="amountRules"
            class="mb-4"
            autofocus
          >
            <template #append-inner>
              <span class="text-caption text-medium-emphasis">ZAR</span>
            </template>
          </v-text-field>

          <!-- Available Balance -->
          <v-alert color="info" variant="tonal" class="mb-4">
            Available balance: <strong>R{{ maxAmount.toLocaleString() }}</strong>
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
          @click="$emit('update:modelValue', false)"
          :disabled="loading"
        >
          Cancel
        </v-btn>
        <v-btn
          color="warning"
          variant="elevated"
          @click="handleSubmit"
          :loading="loading"
          :disabled="!valid"
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
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  maxAmount: {
    type: Number,
    default: 10000
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

// Form state
const form = ref(null)
const valid = ref(false)
const amount = ref('')
const withdrawalMethod = ref('')
const loading = ref(false)

// Configuration
const withdrawalMethods = [
  {
    value: 'bank',
    label: 'Bank Account',
    icon: 'mdi-bank',
    description: 'Direct transfer to your bank account'
  },
  {
    value: 'ewallet',
    label: 'E-Wallet',
    icon: 'mdi-wallet',
    description: 'Transfer to your e-wallet'
  },
  {
    value: 'card',
    label: 'Debit Card',
    icon: 'mdi-credit-card',
    description: 'Instant transfer to your card'
  }
]

// Validation rules
const amountRules = [
  v => !!v || 'Amount is required',
  v => v >= 50 || 'Minimum withdrawal is R50',
  v => v <= props.maxAmount || `Maximum withdrawal is R${props.maxAmount.toLocaleString()}`,
  v => /^\d+(\.\d{1,2})?$/.test(v) || 'Invalid amount format'
]

// Methods
const handleSubmit = async () => {
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return

  loading.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate success
    emit('success', parseFloat(amount.value), withdrawalMethod.value)
    emit('update:modelValue', false)

    // Reset form
    amount.value = ''
    withdrawalMethod.value = ''
    form.value.reset()
  } catch (error) {
    console.error('Withdrawal failed:', error)
  } finally {
    loading.value = false
  }
}
</script>
