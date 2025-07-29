<template>
  <div class="d-flex align-center ga-2">
    <v-menu>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          variant="outlined"
          size="small"
          class="text-capitalize"
        >
          <v-icon start>mdi-filter-variant</v-icon>
          {{ filterLabel }}
        </v-btn>
      </template>

      <v-list density="compact">
        <v-list-item
          v-for="option in filterOptions"
          :key="option.value"
          @click="$emit('update:filter', option.value)"
          :active="filter === option.value"
        >
          <v-list-item-title>{{ option.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          variant="outlined"
          size="small"
          class="text-capitalize"
        >
          <v-icon start>mdi-sort</v-icon>
          {{ sortLabel }}
        </v-btn>
      </template>

      <v-list density="compact">
        <v-list-item
          v-for="option in sortOptions"
          :key="option.value"
          @click="$emit('update:sort', option.value)"
          :active="sort === option.value"
        >
          <v-list-item-title>{{ option.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  filter: {
    type: String,
    default: 'all'
  },
  sort: {
    type: String,
    default: 'date-desc'
  }
})

defineEmits(['update:filter', 'update:sort'])

const filterOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'withdrawal', label: 'Withdrawals' }
]

const sortOptions = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'amount-desc', label: 'Highest Amount' },
  { value: 'amount-asc', label: 'Lowest Amount' }
]

const filterLabel = computed(() => {
  const option = filterOptions.find(opt => opt.value === props.filter)
  return option?.label || 'Filter'
})

const sortLabel = computed(() => {
  const option = sortOptions.find(opt => opt.value === props.sort)
  return option?.label || 'Sort'
})
</script>
