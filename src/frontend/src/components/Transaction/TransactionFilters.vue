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
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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

const filterOptions = computed(() => [
  { value: 'all', label: t('filters.all') },
  { value: 'deposit', label: t('filters.deposits') },
  { value: 'withdrawal', label: t('filters.withdrawals') }
])

const sortOptions = computed(() => [
  { value: 'date-desc', label: t('filters.newest') },
  { value: 'date-asc', label: t('filters.oldest') },
  { value: 'amount-desc', label: t('filters.highest') },
  { value: 'amount-asc', label: t('filters.lowest') }
])

const filterLabel = computed(() => {
  const option = filterOptions.value.find(opt => opt.value === props.filter)
  return option?.label || t('filters.all')
})

const sortLabel = computed(() => {
  const option = sortOptions.value.find(opt => opt.value === props.sort)
  return option?.label || t('filters.newest')
})
</script>
