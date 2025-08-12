<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        variant="text"
        size="small"
      >
        <v-icon>mdi-translate</v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-list-item
        v-for="locale in availableLocales"
        :key="locale.code"
        @click="changeLocale(locale.code)"
        :active="currentLocale === locale.code"
      >
        <v-list-item-title>{{ locale.name }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const currentLocale = computed(() => locale.value)

const availableLocales = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' }
]

const changeLocale = (newLocale) => {
  locale.value = newLocale
}
</script>
