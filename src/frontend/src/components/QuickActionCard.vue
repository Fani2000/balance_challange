<template>
  <v-card
    @click="$emit('click')"
    :color="color"
    variant="tonal"
    class="quick-action-card text-center cursor-pointer"
    rounded="xl"
    hover
  >
    <v-card-text class="pa-4">
      <v-icon
        :icon="icon"
        size="32"
        :color="color"
        class="mb-2"
      ></v-icon>
      <h4 class="text-subtitle-1 font-weight-bold mb-1">{{ title }}</h4>
      <p class="text-caption text-medium-emphasis">{{ subtitle }}</p>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  icon: String,
  title: String,
  subtitle: String,
  color: {
    type: String,
    default: 'primary'
  }
})

defineEmits(['click'])
</script>

<style scoped>
.quick-action-card {
  transition: all 0.3s ease;
}

.quick-action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.cursor-pointer {
  cursor: pointer;
}
</style>
