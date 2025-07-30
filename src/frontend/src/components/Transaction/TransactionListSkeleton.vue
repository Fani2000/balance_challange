<template>
  <v-card rounded="xl" class="elevation-2">
    <v-card-title class="pa-6 pb-3">
      <v-skeleton-loader type="heading" width="200"></v-skeleton-loader>
    </v-card-title>

    <v-list class="pa-0">
      <v-list-item
        v-for="n in 5"
        :key="n"
        class="px-6 py-4"
      >
        <template #prepend>
          <v-skeleton-loader type="avatar" class="mr-4"></v-skeleton-loader>
        </template>
        <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
        <template #append>
          <v-skeleton-loader type="text" width="80"></v-skeleton-loader>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>
