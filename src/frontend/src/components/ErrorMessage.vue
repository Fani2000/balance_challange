<template>
  <v-card rounded="xl" class="elevation-2 text-center pa-8">
    <v-icon
      size="64"
      color="error"
      class="mb-4"
    >
      mdi-alert-circle-outline
    </v-icon>

    <h3 class="text-h6 text-error mb-2">Something went wrong</h3>

    <p class="text-body-2 text-medium-emphasis mb-6">
      {{ message }}
    </p>

    <v-btn
      color="primary"
      variant="elevated"
      @click="$emit('retry')"
      class="px-6"
    >
      <v-icon start>mdi-refresh</v-icon>
      Try Again
    </v-btn>
  </v-card>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'An unexpected error occurred. Please try again.'
  }
})

defineEmits(['retry'])
</script>
