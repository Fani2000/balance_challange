<template>
  <v-card rounded="xl" class="elevation-2">
    <div class="wallet-gradient pa-6 pa-md-8">
      <div class="d-flex flex-column flex-md-row justify-space-between align-start">
        <div class="flex-grow-1 mb-4 mb-md-0">
          <v-skeleton-loader type="text" width="120" class="mb-2"></v-skeleton-loader>
          <v-skeleton-loader type="heading" width="200" class="mb-2"></v-skeleton-loader>
          <v-skeleton-loader type="text" width="150"></v-skeleton-loader>
        </div>
        <div class="d-flex flex-column flex-sm-row ga-3">
          <v-skeleton-loader type="button" width="120"></v-skeleton-loader>
          <v-skeleton-loader type="button" width="120"></v-skeleton-loader>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.wallet-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
